module Main exposing (..)

import Date exposing (..)
import Util exposing (unwrap, onClickLink)
import Html exposing (Html, a, button, div, h1, h3, h4, header, i, img, li, main_, nav, p, program, section, span, text, ul)
import Html.Attributes exposing (alt, class, for, href, id, placeholder, src, type_)
import Html.Events exposing (onClick, onWithOptions)
import Navigation
import SelectList
import Port exposing (..)
import Routes exposing (Route)
import Task exposing (perform)
import SelectList as Zip exposing (fromLists, toList, select, selected, SelectList)
import Data.Project exposing (Project)


{- MODEL -}


type Direction
    = Right
    | Left


type Page
    = Blank
    | NotFound
    | Home
    | Projects
    | ActiveProject
    | Contact


type PageState
    = Loaded Page
    | TransitioningFrom Page


type alias NavLink =
    { to : Route
    , label : String
    }


type alias Model =
    { screenData : Maybe ScreenData
    , navIsOpen : Bool
    , page : Route
    , currentYear : Int
    , navLinks : List NavLink
    , projects : SelectList Project
    }


initialModel : Model
initialModel =
    { screenData = Nothing
    , navIsOpen = False
    , page = Routes.Home
    , currentYear = 0
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
    , navLinks =
        [ { to = Routes.Home, label = "Home" }
        , { to = Routes.About, label = "About" }
        , { to = Routes.Projects, label = "Projects" }
        , { to = Routes.Contact, label = "Contact" }
        ]
    }



{- VIEW -}


view : Model -> Html Msg
view model =
    let
        { page, projects, navIsOpen, screenData, navLinks, currentYear } =
            model

        viewportWidth : Int
        viewportWidth =
            unwrap 0 .viewportWidth screenData

        appShell : List (Html Msg) -> Html Msg
        appShell rest =
            div [ class "__page-wrapper__" ]
                ([ navBar navIsOpen viewportWidth navLinks ]
                    |> List.append rest
                )

        appFooter =
            footer currentYear
    in
        case page of
            Routes.Home ->
                appShell [ aboveTheFold navIsOpen ]

            Routes.About ->
                appShell [ about, appFooter ]

            Routes.Projects ->
                appShell [ project projects, appFooter ]

            Routes.ActiveProject slug ->
                appShell [ Data.Project.viewProject slug (SelectList.toList projects) ]

            Routes.Contact ->
                appShell [ contact, appFooter ]

            Routes.NotFound ->
                appShell [ contact ]


navBar : Bool -> Int -> List NavLink -> Html Msg
navBar navIsOpen viewportWidth navLinks =
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
                (List.map renderNavLink navLinks)
            , if viewportWidth > 768 then
                {- DONT SHOW HAMBURGER ON DESKTOP -}
                Html.text ""
              else
                hamburgerMenu navIsOpen
            ]


renderNavLink : NavLink -> Html Msg
renderNavLink { to, label } =
    li []
        [ a [ Routes.href to, onClickLink (NavigateTo to) ] [ text label ]
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


project : SelectList Project -> Html Msg
project projects =
    let
        currentProj =
            projects |> Zip.selected |> renderProjectCard

        backgroundClass =
            "bg-gif " ++ (projects |> Zip.selected |> .bgClass)
    in
        section [ id "project" ]
            [ div [ class backgroundClass ] []
            , h1 [ id "port-header" ] [ text "Previous work" ]
            , a [ Routes.href (Routes.ActiveProject "vinyldb"), onClickLink (NavigateTo (Routes.ActiveProject "vinyldb")) ] [ text "CLICK ME" ]
            , button [ onClick (SwitchProject Right) ] [ text "Next" ]
            , button [ onClick (SwitchProject Left) ] [ text "Back" ]
            , div [ id "project-container" ] [ currentProj ]
            ]


renderProjectCard : Project -> Html Msg
renderProjectCard project =
    let
        { title, imageData, techStack, description, repo, demo } =
            project
    in
        div [ class "project-card" ]
            [ h1 [] [ text title ]
            , ul [ class "proj-thumbnails" ] (List.map (\i -> li [] [ img [ src i.src, alt i.alt ] [] ]) imageData)
            , div [ class "tech-container" ]
                [ h4 [] [ text "Technology" ]
                , ul [] (List.map (\tech -> li [] [ text tech ]) techStack)
                ]
            , p [ class "links" ]
                [ a [ href repo ] [ text "Repo" ]
                , text " | "
                , a [ href demo ] [ text "Demo" ]
                ]
            , p [ class "description" ]
                [ p [] [ text description ]
                ]
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
    | SwitchProject Direction


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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            model ! []

        SetRoute maybeRoute ->
            setRoute maybeRoute model [ perform GetYear Date.now ]

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

        SwitchProject dir ->
            let
                getListHead : List Project -> Project
                getListHead projectList =
                    projectList |> List.head |> Maybe.withDefault (Zip.selected model.projects)

                nextSelectedProject : Project
                nextSelectedProject =
                    case dir of
                        Right ->
                            model.projects |> Zip.after |> getListHead

                        Left ->
                            model.projects |> Zip.before |> List.reverse |> getListHead

                nextProjectState : SelectList Project
                nextProjectState =
                    Zip.select (\a -> a == nextSelectedProject) model.projects
            in
                { model | projects = nextProjectState } ! []



{- INIT -}


init : Navigation.Location -> ( Model, Cmd Msg )
init location =
    let
        cmd =
            [ perform GetYear Date.now ]

        maybeRoute =
            location |> Routes.fromLocation
    in
        setRoute maybeRoute initialModel cmd



{- MAIN PROGRAM -}


main : Program Never Model Msg
main =
    Navigation.program (Routes.fromLocation >> SetRoute)
        { init = init
        , view = view
        , update = update
        , subscriptions =
            \model ->
                Sub.batch
                    [ getInfoFromOutside Outside LogErr ]
        }
