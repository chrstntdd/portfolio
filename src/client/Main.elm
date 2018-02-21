port module Main exposing (..)

import Date exposing (..)
import Util exposing (unwrap, onClickLink)
import Html exposing (Html, Attribute, a, button, div, h1, h3, h4, header, i, img, li, main_, nav, p, program, section, span, text, ul)
import Html.Attributes exposing (alt, class, for, href, id, placeholder, src, type_)
import Html.Events exposing (onClick)
import Json.Decode as D exposing (..)
import Json.Decode.Pipeline exposing (decode, required)
import Json.Encode as E exposing (..)
import Navigation
import Routes exposing (Route)
import Task exposing (perform)
import Time exposing (every)
import SelectList as Zip exposing (fromLists, toList, select, selected, SelectList)
import Data.Project exposing (Project)


type alias LinkData msg =
    { url : Route
    , attrs : List (Attribute msg)
    , label : String
    }


link : LinkData Msg -> Html Msg
link { url, attrs, label } =
    {- HELPER FUNCTION FOR SPA NAVIGATION -}
    a (List.append attrs [ Routes.href url, onClickLink (NavigateTo url) ]) [ text label ]



{- PORT HELPERS -}
-- CURRENTLY DEFINED IN MAIN TO HAVE ACCESS TO `MODEL` TYPE WHEN PERSISTING STATE


type alias ScreenData =
    { scrollTop : Float
    , pageHeight : Int
    , viewportHeight : Int
    , viewportWidth : Int
    }


type InfoForOutside
    = SaveModel Model
    | ScrollTo String
    | LogErrorToConsole String


type InfoForElm
    = ScrollOrResize ScreenData


screenDataDecoder : Decoder ScreenData
screenDataDecoder =
    decode ScreenData
        |> required "scrollTop" D.float
        |> required "pageHeight" D.int
        |> required "viewportHeight" D.int
        |> required "viewportWidth" D.int


modelToValue : Model -> E.Value
modelToValue model =
    E.object
        [ ( "navIsOpen", E.bool model.navIsOpen )
        ]


sendInfoOutside : InfoForOutside -> Cmd msg
sendInfoOutside info =
    case info of
        SaveModel newModel ->
            infoForOutside { tag = "SaveModel", data = modelToValue newModel }

        ScrollTo elementId ->
            infoForOutside { tag = "ScrollTo", data = E.string elementId }

        LogErrorToConsole err ->
            infoForOutside { tag = "ErrorLogRequested", data = E.string err }


getInfoFromOutside : (InfoForElm -> msg) -> (String -> msg) -> Sub msg
getInfoFromOutside tagger onError =
    infoForElm
        (\outsideInfo ->
            case outsideInfo.tag of
                "ScrollOrResize" ->
                    case D.decodeValue screenDataDecoder outsideInfo.data of
                        Ok screenData ->
                            tagger <| ScrollOrResize screenData

                        Err e ->
                            onError e

                _ ->
                    onError <| "Unexpected info from the outside: " ++ toString outsideInfo
        )


type alias GenericOutsideData =
    {- COMMUNICATION IS HANDLED BY PATTERN MATCHING THE TAG FIELD AND SENDING SERIALIZED DATA -}
    { tag : String, data : E.Value }


port infoForOutside : GenericOutsideData -> Cmd msg


port infoForElm : (GenericOutsideData -> msg) -> Sub msg



{- MODEL -}


type Direction
    = Next
    | Back


type ProjectSwitchBehavior
    = Auto
    | UserControlled


type alias Model =
    { screenData : Maybe ScreenData
    , navIsOpen : Bool
    , page : Route
    , currentYear : Int
    , autoSwitchProjectTimeout : Time.Time
    , switchProjectBehavior : ProjectSwitchBehavior
    , projects : SelectList Project
    }


initialModel : Model
initialModel =
    { screenData = Nothing
    , navIsOpen = False
    , page = Routes.Home
    , currentYear = 0
    , autoSwitchProjectTimeout = 5 -- seconds
    , switchProjectBehavior = Auto
    , projects =
        fromLists []
            { title = "Quantified"
            , slug = "quantified"
            , imageData =
                [ { src = "/assets/screenshots/q1-ss-min.png", alt = "" }
                , { src = "/assets/screenshots/q2-ss-min.png", alt = "" }
                , { src = "/assets/screenshots/q3-ss-min.png", alt = "" }
                ]
            , bgClass = "quant-bg-gif"
            , techStack =
                [ "HTML5"
                , "React / Redux"
                , "TypeScript / JavaScript"
                , "Jest w/ Enzyme"
                , "SCSS / CSS"
                , "NodeJS / Express"
                , "MongoDB / Mongoose"
                , "Travis CI"
                ]
            , repo = "https://github.com/chrstntdd/bby-react"
            , demo = "https://quantified.netlify.com/"
            , description =
                "Full stack React/Redux application with separate API powered by the Best Buy API that allows users to organize product data into a table."
            }
            [ { title = "VinylDB"
              , slug = "vinyldb"
              , imageData =
                    [ { src = "/assets/screenshots/vdb-ss-1-min.png", alt = "desc" }
                    , { src = "/assets/screenshots/vdb-ss-2-min.png", alt = "desc" }
                    , { src = "/assets/screenshots/vdb-ss-3-min.png", alt = "desc" }
                    ]
              , bgClass = "vdb-bg-gif"
              , techStack =
                    [ "HTML5"
                    , "PUG"
                    , "SCSS / CSS"
                    , "Javascript / jQuery"
                    , "NodeJS / Express"
                    , "Mocha / Chai"
                    , "MongoDB / Mongoose"
                    , "Travis CI"
                    ]
              , repo = "https://github.com/chrstntdd/vinyl-db"
              , demo = "https://obscure-island-83164.herokuapp.com/"
              , description =
                    "Full stack Javascript web application utilizing the Discogs API to manage/track user's vinyl collection."
              }
            , { title = "Roaster Nexus"
              , slug = "roaster-nexus"
              , imageData =
                    [ { src = "/assets/screenshots/rn-ss-1-min.png", alt = "des" }
                    , { src = "/assets/screenshots/rn-ss-2-min.png", alt = "des" }
                    , { src = "/assets/screenshots/rn-ss-3-min.png", alt = "des" }
                    ]
              , bgClass = "rn-bg-gif"
              , techStack =
                    [ "HTML5"
                    , "SCSS / CSS"
                    , "jQuery"
                    , "Google Maps API"
                    ]
              , repo = "https://github.com/chrstntdd/roaster-nexus"
              , demo = "https://chrstntdd.github.io/roaster-nexus/"
              , description =
                    "Web app powered by the Google Maps API and Jquery that connects users with local coffee roasters."
              }
            ]
    }



{- VIEW -}


view : Model -> Html Msg
view model =
    let
        { page, projects, navIsOpen, screenData, currentYear } =
            model

        viewportWidth : Int
        viewportWidth =
            unwrap 0 .viewportWidth screenData

        appShell : List (Html Msg) -> Html Msg
        appShell rest =
            div [ class "__page-wrapper__" ]
                ([ navBar navIsOpen viewportWidth ] |> List.append rest)

        appFooter =
            footer currentYear
    in
        case page of
            Routes.Home ->
                appShell [ aboveTheFold navIsOpen ]

            Routes.About ->
                appShell [ about, appFooter ]

            Routes.Projects ->
                appShell [ projectsView projects ]

            Routes.ActiveProject slug ->
                appShell [ Data.Project.viewProject slug (Zip.toList projects) ]

            Routes.Contact ->
                appShell [ contact, appFooter ]

            Routes.NotFound ->
                appShell [ contact ]


navBar : Bool -> Int -> Html Msg
navBar navIsOpen viewportWidth =
    let
        navClass =
            if navIsOpen then
                class "show"
            else
                class ""
    in
        nav
            [ id "main-nav", navClass ]
            [ ul [ id "nav-list" ]
                [ li []
                    [ link { url = Routes.Home, attrs = [], label = "Home" } ]
                , li []
                    [ link { url = Routes.About, attrs = [], label = "About" } ]
                , li []
                    [ link { url = Routes.Projects, attrs = [], label = "Projects" } ]
                , li []
                    [ link { url = Routes.Contact, attrs = [], label = "Contact" } ]
                , if viewportWidth > 768 then
                    {- DONT SHOW HAMBURGER ON DESKTOP -}
                    Html.text ""
                  else
                    hamburgerMenu navIsOpen
                ]
            ]


hamburgerMenu : Bool -> Html Msg
hamburgerMenu navIsOpen =
    let
        hamburgerClass =
            if navIsOpen then
                class "hamburger is-open"
            else
                class "hamburger"
    in
        button [ id "hamburger-button", onClick ToggleHamburger ]
            [ span
                [ hamburgerClass ]
                [ span [ class "hamburger-inner" ] [] ]
            ]


aboveTheFold : Bool -> Html Msg
aboveTheFold navIsOpen =
    let
        overlayAttrs =
            if navIsOpen then
                [ class "overlay on", onClick ToggleHamburger ]
            else
                [ class "overlay" ]
    in
        header []
            [ div overlayAttrs []
            , div [ id "hero-img" ] []
            , div [ id "hero-text" ]
                [ h1 [] [ text "Christian Todd" ]
                , h3 [] [ text "Web Developer" ]
                ]
            ]


about : Html Msg
about =
    main_ []
        [ section [ id "about" ]
            [ div [ id "about-container" ]
                [ h1 [] [ text "About me" ]
                , img [ src "/assets/portrait.jpg", alt "2017 Portrait of myself" ] []
                , p [] [ text "Hi, my name is Christian. I was first introduced to programming as a college student studying mechanical engineering.\n          I was initially fascinated by how vast the world of code is and everything there is to learn. I remain interested\n          by how there are countless ways to express a solution to a problem and the opportunities for constant iteration\n          upon what already exists. When I'm not busy programming, you can usually find me outside exploring the North End\n          beaches in my hometown of Virginia Beach. I also enjoy listening to my growing vinyl collection and sipping on\n          locally roasted coffee." ]
                ]
            ]
        ]


projectsView : SelectList Project -> Html Msg
projectsView projects =
    section [ id "projects" ]
        [ div [ class ("bg-gif " ++ (projects |> Zip.selected |> .bgClass)) ] []
        , h1 [ class "heading-font abs-center" ] [ projects |> Zip.selected |> .title |> text ]
        , div [ class "view-project-container" ]
            [ link
                { url = projects |> Zip.selected |> .slug |> Routes.ActiveProject
                , attrs = [ class "view-project-link" ]
                , label = "view project"
                }
            ]
        , button [ class "next-proj-btn", onClick (SwitchProject Next UserControlled 0) ] [ img [ src "/assets/icons/chevron.svg", alt "Next button" ] [] ]
        , button [ class "prev-proj-btn", onClick (SwitchProject Back UserControlled 0) ] [ img [ src "/assets/icons/chevron.svg", alt "Back button" ] [] ]
        ]


contact : Html Msg
contact =
    section [ id "contact" ]
        [ p [] [ text "Let's talk:" ]
        , p [ class "email" ] [ text "christian.todd7@gmail.com" ]
        , ul []
            [ li []
                [ a [ href "https://github.com/chrstntdd" ] [ img [ src "/assets/icons/github.svg", alt "Github mark icon" ] [] ]
                ]
            , li []
                [ a [ href "https://www.linkedin.com/in/christian-todd-b5b98513a/" ] [ img [ src "/assets/icons/linkedin.svg", alt "LinkedIn text icon" ] [] ]
                ]
            , li []
                [ a [ href "https://twitter.com/_chrstntdd?lang=en" ] [ img [ src "/assets/icons/twitter.svg", alt "twitter bird icon" ] [] ]
                ]
            ]
        ]


footer : Int -> Html Msg
footer currentYear =
    Html.footer [ class "content-info" ]
        [ p [] [ text ("Christian Todd | " ++ toString currentYear) ]
        ]



{- UPDATE -}


type Msg
    = NoOp
    | SetRoute (Maybe Route)
    | ToggleHamburger
    | NavigateTo Route
    | Outside InfoForElm
    | LogErr String
    | GetYear Date
    | SwitchProject Direction ProjectSwitchBehavior Time.Time
    | Tick Time.Time


setRoute : Maybe Route -> Model -> List (Cmd Msg) -> ( Model, Cmd Msg )
setRoute maybeRoute model cmds =
    case maybeRoute of
        Nothing ->
            { model | page = Routes.NotFound } ! cmds

        Just Routes.Home ->
            { model | page = Routes.Home } ! cmds

        Just Routes.About ->
            { model | page = Routes.About } ! cmds

        Just Routes.Projects ->
            { model | page = Routes.Projects } ! cmds

        Just (Routes.ActiveProject slug) ->
            { model | page = Routes.ActiveProject slug } ! cmds

        Just Routes.Contact ->
            { model | page = Routes.Contact } ! cmds

        _ ->
            { model | page = Routes.NotFound } ! cmds


updateWithStorage : Msg -> Model -> ( Model, Cmd Msg )
updateWithStorage msg model =
    let
        ( newModel, cmds ) =
            update msg model
    in
        ( newModel, Cmd.batch [ sendInfoOutside (SaveModel newModel), cmds ] )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            model ! []

        SetRoute maybeRoute ->
            setRoute maybeRoute model []

        Outside infoForElm ->
            case infoForElm of
                ScrollOrResize data ->
                    { model | screenData = Just data } ! []

        LogErr err ->
            model ! [ sendInfoOutside (LogErrorToConsole err) ]

        GetYear date ->
            { model | currentYear = Date.year date } ! []

        NavigateTo page ->
            {- THE SECOND ARGUMENT TO routeToString IS A JWT FOR VALIDATION, IF NEEDED -}
            { model | navIsOpen = False } ! [ Navigation.newUrl (Routes.routeToString page "") ]

        ToggleHamburger ->
            { model | navIsOpen = not model.navIsOpen } ! []

        SwitchProject dir projectSwitchBehavior time ->
            let
                getListHead : List Project -> Project
                getListHead projectList =
                    projectList |> List.head |> Maybe.withDefault (Zip.selected model.projects)

                nextProject : Project
                nextProject =
                    case dir of
                        Back ->
                            if (model.projects |> Zip.before |> List.isEmpty) then
                                -- RETURN THE LAST ITEM IN THE SELECT LIST
                                model.projects |> Zip.after |> List.reverse |> getListHead
                            else
                                -- RETURN THE LAST ITEM IN THE 'BEFORE' OF THE SELECT LIST
                                model.projects |> Zip.before |> List.reverse |> getListHead

                        Next ->
                            if (model.projects |> Zip.after |> List.isEmpty) then
                                -- RETURN THE FIRST ITEM IN THE SELECT LIST
                                model.projects |> Zip.before |> getListHead
                            else
                                -- RETURN THE HEAD OF THE LIST
                                model.projects |> Zip.after |> getListHead

                nextProjectState : SelectList Project
                nextProjectState =
                    Zip.select (\a -> a == nextProject) model.projects
            in
                case projectSwitchBehavior of
                    Auto ->
                        { model | projects = nextProjectState } ! []

                    UserControlled ->
                        { model
                            | projects = nextProjectState
                            , autoSwitchProjectTimeout = 5 -- INIT VALUE TO RESET THE TIMEOUT
                            , switchProjectBehavior = UserControlled
                        }
                            ! []

        Tick time ->
            let
                newSeconds =
                    model.autoSwitchProjectTimeout - 1
            in
                if newSeconds == -1 then
                    { model | autoSwitchProjectTimeout = 5, switchProjectBehavior = Auto } ! []
                else
                    { model | autoSwitchProjectTimeout = newSeconds } ! []



{- INIT -}
-- TODO: savedModel will eventually be the persisted model in sessionStorage
-- Once we persist the state, on init we should check for the session first before using the initialModel
-- Also, we have to convert the Zip List to a regular List for Javascript


init : Maybe D.Value -> Navigation.Location -> ( Model, Cmd Msg )
init savedModel location =
    let
        maybeRoute =
            location |> Routes.fromLocation
    in
        setRoute maybeRoute initialModel [ perform GetYear Date.now ]



{- SUBSCRIPTIONS -}


subscriptions : Model -> Sub Msg
subscriptions model =
    if model.page == Routes.Projects then
        -- WE ONLY START THE SUBSCRIPTION TO CYCLE THROUGH PROJECTS IF WE'RE ON THE `PROJECTS` PAGE
        case model.switchProjectBehavior of
            Auto ->
                -- FOR AUTO BEHAVIOR, WE SEND A `SWITCHPROJECT` MSG TO ENABLE SWITCHING TO THE NEXT PROJECT
                Sub.batch
                    [ getInfoFromOutside Outside LogErr, every (5 * Time.second) (SwitchProject Next Auto) ]

            UserControlled ->
                -- FOR USER CONTROLLED BEHAVIOR, WE SEND A `TICK` MSG EVERY SECOND TO TRACK THE TIMEOUT
                Sub.batch
                    [ getInfoFromOutside Outside LogErr, every Time.second Tick ]
    else
        Sub.batch
            [ getInfoFromOutside Outside LogErr ]



{- MAIN PROGRAM -}


main : Program (Maybe D.Value) Model Msg
main =
    Navigation.programWithFlags (Routes.fromLocation >> SetRoute)
        { init = init
        , view = view
        , update = updateWithStorage
        , subscriptions = subscriptions
        }
