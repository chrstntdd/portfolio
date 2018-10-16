port module Main exposing (main)

import Browser
import Browser.Navigation as Navigation
import Data.Project exposing (Project, viewProject)
import Html exposing (Attribute, Html, a, button, div, h1, h3, h4, header, i, img, li, main_, nav, p, section, span, text, ul)
import Html.Attributes exposing (alt, attribute, class, for, href, id, placeholder, src, type_)
import Html.Events exposing (onClick)
import Json.Decode as D exposing (..)
import Json.Decode.Pipeline exposing (required)
import Json.Encode as E exposing (..)
import Routes exposing (Route)
import SelectList as Zip exposing (SelectList, fromLists, select, selected, toList)
import Time exposing (every)
import Url
import Util exposing (unwrap)


type alias LinkData msg =
    { url : Route
    , attrs : List (Attribute msg)
    , label : String
    }


link : LinkData Msg -> Html Msg
link { url, attrs, label } =
    {- HELPER FUNCTION FOR SPA NAVIGATION -}
    a (List.append attrs [ Routes.href url ]) [ text label ]



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
                -- "ScrollOrResize" ->
                --     case D.decodeValue screenDataDecoder outsideInfo.data of
                --         Ok screenData ->
                --             tagger <| ScrollOrResize screenData
                --         Err e ->
                --             onError e
                _ ->
                    onError <| "Unexpected info from the outside: "
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
    , key : Navigation.Key
    , url : Url.Url
    , navIsOpen : Bool
    , page : Route
    , autoSwitchProjectTimeout : Time.Posix
    , switchProjectBehavior : ProjectSwitchBehavior
    , projects : SelectList Project
    }


initialModel : ( Navigation.Key, Url.Url ) -> Model
initialModel ( navigationKey, navigationUrl ) =
    { screenData = Nothing
    , key = navigationKey
    , url = navigationUrl
    , navIsOpen = False
    , page = Routes.Home
    , autoSwitchProjectTimeout = Time.millisToPosix 5000
    , switchProjectBehavior = Auto
    , projects =
        fromLists []
            { title = "Quantified"
            , slug = "quantified"
            , imageData =
                [ { src = "/images/screenshots/q1-ss-min.png", alt = "" }
                , { src = "/images/screenshots/q2-ss-min.png", alt = "" }
                , { src = "/images/screenshots/q3-ss-min.png", alt = "" }
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
            , tagline = "A streamlined system for efficiently and accurately managing retail inventory"
            }
            [ { title = "VinylDB"
              , slug = "vinyldb"
              , imageData =
                    [ { src = "/images/screenshots/vdb-ss-1-min.png", alt = "desc" }
                    , { src = "/images/screenshots/vdb-ss-2-min.png", alt = "desc" }
                    , { src = "/images/screenshots/vdb-ss-3-min.png", alt = "desc" }
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
              , tagline = "Your personal vinyl discography, always at your fingertips"
              }
            , { title = "Roaster Nexus"
              , slug = "roaster-nexus"
              , imageData =
                    [ { src = "/images/screenshots/rn-ss-1-min.png", alt = "des" }
                    , { src = "/images/screenshots/rn-ss-2-min.png", alt = "des" }
                    , { src = "/images/screenshots/rn-ss-3-min.png", alt = "des" }
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
              , tagline = "Explore and discover both local and non-local coffee roasters"
              }
            ]
    }



{- VIEW -}


view : Model -> Browser.Document Msg
view model =
    { title = "Christian Todd | Web Developer"
    , body = [ body model ]
    }


body : Model -> Html Msg
body model =
    let
        { page, projects, navIsOpen, screenData } =
            model

        viewportWidth : Int
        viewportWidth =
            unwrap 0 .viewportWidth screenData

        appShell : List (Html Msg) -> Html Msg
        appShell rest =
            div []
                ([ navBar navIsOpen viewportWidth ] |> List.append rest)
    in
    case page of
        Routes.Home ->
            appShell [ aboveTheFold ]

        Routes.About ->
            appShell [ about ]

        Routes.Projects ->
            appShell [ projectsView projects ]

        Routes.ActiveProject slug ->
            appShell [ viewProject slug (Zip.toList projects) ]

        Routes.Contact ->
            appShell [ contact ]

        Routes.NotFound ->
            appShell [ contact ]


navBar : Bool -> Int -> Html Msg
navBar navIsOpen viewportWidth =
    let
        navClass =
            let
                shared =
                    "main-nav fixed pin-t h-full md:transparent md:w-full md:h-auto trans-300ms-all"
            in
            if navIsOpen then
                class (shared ++ " show")

            else
                class shared

        linkClass =
            class "no-underline uppercase text-center text-white"

        liClass =
            class "list-reset m-4"
    in
    nav
        [ navClass ]
        [ ul [ class "pl-0 flex justify-end flex-col md:flex-row " ]
            [ li [ liClass ]
                [ link { url = Routes.Home, attrs = [ linkClass ], label = "Home" } ]
            , li [ liClass ]
                [ link { url = Routes.About, attrs = [ linkClass ], label = "About" } ]
            , li [ liClass ]
                [ link { url = Routes.Projects, attrs = [ linkClass ], label = "Projects" } ]
            , li [ liClass ]
                [ link { url = Routes.Contact, attrs = [ linkClass ], label = "Contact" } ]
            ]
        , if viewportWidth > 768 then
            {- DONT SHOW HAMBURGER ON DESKTOP -}
            Html.text ""

          else
            hamburgerMenu navIsOpen
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
    button [ id "hamburger-button", onClick ToggleHamburger, attribute "aria-label" "Toggle navigation menu" ]
        [ span
            [ hamburgerClass ]
            [ span [ class "hamburger-inner" ] [] ]
        ]


aboveTheFold : Html Msg
aboveTheFold =
    header [ class "h-screen w-screen flex flex-col items-center justify-center" ]
        [ div [ id "hero-img", class "absolute bg-cover bg-center bg-no-repeat pin" ] []
        , div [ id "hero-text", class "z-10 kinda-center" ]
            [ h1 [ class "text-white font-thin text-center leading-none whitespace-no-wrap massive-text tracking-wide" ] [ text "Christian Todd" ]
            , h3 [ class "text-white font-thin text-center italic" ] [ text "Web Developer" ]
            ]
        ]


about : Html Msg
about =
    main_ []
        [ section [ id "about" ]
            [ div [ id "about-container" ]
                [ h1 [] [ text "About me" ]
                , img [ src "/images/portrait.jpg", alt "2017 Portrait of myself" ] []
                , p [] [ text "Hi, my name is Christian. I was first introduced to programming as a college student studying mechanical engineering.\n          I was initially fascinated by how vast the world of code is and everything there is to learn. I remain interested\n          by how there are countless ways to express a solution to a problem and the opportunities for constant iteration\n          upon what already exists. When I'm not busy programming, you can usually find me outside exploring the North End\n          beaches in my hometown of Virginia Beach. I also enjoy listening to my growing vinyl collection and sipping on\n          locally roasted coffee." ]
                ]
            ]
        ]


projectsView : SelectList Project -> Html Msg
projectsView projects =
    section [ id "projects" ]
        [ div [ class ("bg-center bg-no-repeat bg-cover bg-scroll h-screen w-screen " ++ (projects |> Zip.selected |> .bgClass)) ] []
        , h1 [ class "leading-loose whitespace-no-wrap text-white kinda-center" ] [ projects |> Zip.selected |> .title |> text ]
        , div [ class "view-project-container" ]
            [ link
                { url = projects |> Zip.selected |> .slug |> Routes.ActiveProject
                , attrs = [ class "view-project-link" ]
                , label = "view project"
                }
            ]
        , button [ attribute "aria-label" "Next project", class "next-btn proj-btn", onClick (SwitchProject Next UserControlled (Time.millisToPosix 0)) ] [ img [ class "h-16 w-16", src "/images/icons/chevron.svg", alt "Next project" ] [] ]
        , button [ attribute "aria-label" "Previous project", class "prev-btn proj-btn", onClick (SwitchProject Back UserControlled (Time.millisToPosix 0)) ] [ img [ class "h-16 w-16", src "/images/icons/chevron.svg", alt "Previous project" ] [] ]
        ]


contact : Html Msg
contact =
    let
        listClass =
            "list-reset"

        anchorClass =
            "no-underline mb-0"

        imgClass =
            "m-3"

        pClass =
            "text-white mt-2 mb-2"
    in
    section [ id "contact", class "h-screen w-screen flex flex-col items-center justify-center" ]
        [ p [ class pClass ] [ text "Let's talk:" ]
        , p [ class (pClass ++ " font-semibold hover:text-grey trans-300ms-all") ] [ text "christian.todd7@gmail.com" ]
        , ul [ class "pl-0 flex flex-col justify-center items-center" ]
            [ li [ class listClass ]
                [ a [ href "https://github.com/chrstntdd", class anchorClass ] [ img [ src "/images/icons/github.svg", alt "Github mark icon", class imgClass ] [] ] ]
            , li [ class listClass ]
                [ a [ href "https://www.linkedin.com/in/christian-todd-b5b98513a/", class anchorClass ] [ img [ src "/images/icons/linkedin.svg", alt "LinkedIn text icon", class imgClass ] [] ] ]
            , li [ class listClass ]
                [ a [ href "https://twitter.com/_chrstntdd", class anchorClass ] [ img [ src "/images/icons/twitter.svg", alt "twitter bird icon", class imgClass ] [] ] ]
            ]
        ]



{- UPDATE -}


type Msg
    = NoOp
    | ToggleHamburger
    | Outside InfoForElm
    | LogErr String
    | SwitchProject Direction ProjectSwitchBehavior Time.Posix
    | Tick Time.Posix
    | UrlChanged Url.Url
    | LinkClicked Browser.UrlRequest


changeRouteTo : Maybe Route -> Model -> ( Model, Cmd Msg )
changeRouteTo maybeRoute model =
    case maybeRoute of
        Just Routes.Home ->
            ( { model | page = Routes.Home }, Cmd.none )

        Just Routes.About ->
            ( { model | page = Routes.About }, Cmd.none )

        Just Routes.Projects ->
            ( { model | page = Routes.Projects }, Cmd.none )

        Just (Routes.ActiveProject slug) ->
            ( { model | page = Routes.ActiveProject slug }, Cmd.none )

        Just Routes.Contact ->
            ( { model | page = Routes.Contact }, Cmd.none )

        Nothing ->
            ( { model | page = Routes.NotFound }, Cmd.none )

        _ ->
            ( { model | page = Routes.NotFound }, Cmd.none )


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
            ( model, Cmd.none )

        LinkClicked urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, Navigation.pushUrl model.key (Url.toString url) )

                Browser.External href ->
                    ( model, Navigation.load href )

        UrlChanged url ->
            changeRouteTo (Routes.fromUrl url) model

        Outside dataForElm ->
            case dataForElm of
                ScrollOrResize data ->
                    ( { model | screenData = Just data }, Cmd.none )

        -- _ ->
        --     ( model, Cmd.none )
        LogErr err ->
            ( model, sendInfoOutside (LogErrorToConsole err) )

        ToggleHamburger ->
            ( { model | navIsOpen = not model.navIsOpen }, Cmd.none )

        SwitchProject dir projectSwitchBehavior time ->
            let
                getListHead : List Project -> Project
                getListHead projectList =
                    projectList |> List.head |> Maybe.withDefault (Zip.selected model.projects)

                nextProject : Project
                nextProject =
                    case dir of
                        Back ->
                            if model.projects |> Zip.before |> List.isEmpty then
                                -- RETURN THE LAST ITEM IN THE SELECT LIST
                                model.projects |> Zip.after |> List.reverse |> getListHead

                            else
                                -- RETURN THE LAST ITEM IN THE 'BEFORE' OF THE SELECT LIST
                                model.projects |> Zip.before |> List.reverse |> getListHead

                        Next ->
                            if model.projects |> Zip.after |> List.isEmpty then
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
                    ( { model | projects = nextProjectState }, Cmd.none )

                UserControlled ->
                    ( { model
                        | projects = nextProjectState
                        , autoSwitchProjectTimeout = Time.millisToPosix 5000 -- INIT VALUE TO RESET THE TIMEOUT
                        , switchProjectBehavior = UserControlled
                      }
                    , Cmd.none
                    )

        Tick time ->
            let
                newMilliseconds =
                    Time.posixToMillis model.autoSwitchProjectTimeout - 1000
            in
            if newMilliseconds == -1 then
                ( { model | autoSwitchProjectTimeout = Time.millisToPosix 5000, switchProjectBehavior = Auto }, Cmd.none )

            else
                ( { model | autoSwitchProjectTimeout = Time.millisToPosix newMilliseconds }, Cmd.none )



{- INIT -}
-- TODO: savedModel will eventually be the persisted model in sessionStorage
-- Once we persist the state, on init we should check for the session first before using the initialModel
-- Also, we have to convert the Zip List to a regular List for Javascript


init : Maybe D.Value -> Url.Url -> Navigation.Key -> ( Model, Cmd Msg )
init savedModel url key =
    let
        maybeRoute =
            url |> Routes.fromUrl
    in
    changeRouteTo maybeRoute (initialModel ( key, url ))



{- SUBSCRIPTIONS -}


subscriptions : Model -> Sub Msg
subscriptions model =
    if model.page == Routes.Projects then
        -- WE ONLY START THE SUBSCRIPTION TO CYCLE THROUGH PROJECTS IF WE'RE ON THE `PROJECTS` PAGE
        case model.switchProjectBehavior of
            Auto ->
                -- FOR AUTO BEHAVIOR, WE SEND A `SWITCHPROJECT` MSG TO ENABLE SWITCHING TO THE NEXT PROJECT
                Sub.batch
                    [ getInfoFromOutside Outside LogErr, every (5 * 1000) (SwitchProject Next Auto) ]

            UserControlled ->
                -- FOR USER CONTROLLED BEHAVIOR, WE SEND A `TICK` MSG EVERY SECOND TO TRACK THE TIMEOUT
                Sub.batch
                    [ getInfoFromOutside Outside LogErr, every 1000 Tick ]

    else
        Sub.batch
            [ getInfoFromOutside Outside LogErr ]



{- MAIN PROGRAM -}


main : Program (Maybe D.Value) Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = updateWithStorage
        , subscriptions = subscriptions
        , onUrlChange = UrlChanged
        , onUrlRequest = LinkClicked
        }
