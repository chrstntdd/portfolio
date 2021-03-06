port module Main exposing (main)

import Array exposing (Array)
import Browser
import Browser.Navigation as Navigation
import Data.Project exposing (Project, viewProject)
import Html exposing (Attribute, Html, a, button, div, form, h1, h3, h4, header, i, img, input, label, legend, li, main_, nav, node, p, section, source, span, text, ul)
import Html.Attributes exposing (alt, attribute, class, for, href, id, media, placeholder, src, type_)
import Html.Events exposing (onClick, onInput, onSubmit)
import Json.Decode as D exposing (..)
import Json.Decode.Pipeline exposing (required)
import Json.Encode as E exposing (..)
import Routes exposing (Route)
import Time exposing (every)
import Url


updateForm : (Form -> Form) -> Model -> ( Model, Cmd Msg )
updateForm transform model =
    ( { model | form = transform model.form }, Cmd.none )


type alias Form =
    { username : String, password : String }



{- MAIN PROGRAM -}


main : Program Bool Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlChange = UrlChanged
        , onUrlRequest = LinkClicked
        }


type alias LinkData msg =
    { url : Route
    , attrs : List (Attribute msg)
    , label : String
    }


link : LinkData Msg -> Html Msg
link { url, attrs, label } =
    {- HELPER FUNCTION FOR SPA NAVIGATION -}
    a (List.append attrs [ Routes.href url ]) [ text label ]



{- MODEL -}


type Direction
    = Next
    | Back


type ProjectSwitchBehavior
    = Auto
    | UserControlled


type alias Model =
    { canUseWebP : Bool
    , form : Form
    , key : Navigation.Key
    , url : Url.Url
    , navIsOpen : Bool
    , page : Route
    , autoSwitchProjectTimeout : Time.Posix
    , switchProjectBehavior : ProjectSwitchBehavior
    , activeProjectIndex : Int
    , projects : Array Project
    }


initialModel : ( Navigation.Key, Url.Url ) -> Model
initialModel ( navigationKey, navigationUrl ) =
    { canUseWebP = False
    , form =
        { username = ""
        , password = ""
        }
    , key = navigationKey
    , url = navigationUrl
    , navIsOpen = False
    , page = Routes.Home
    , autoSwitchProjectTimeout = Time.millisToPosix 5000
    , switchProjectBehavior = Auto
    , activeProjectIndex = 0
    , projects =
        Array.fromList
            [ { title = "Quantified"
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
            , { title = "VinylDB"
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
        { page, activeProjectIndex, projects, navIsOpen, form, canUseWebP } =
            model

        appShell : List (Html Msg) -> Html Msg
        appShell rest =
            div [ class "full-page" ]
                ([ navBar navIsOpen, hamburgerMenu navIsOpen ] |> List.append rest)
    in
    case page of
        Routes.Home ->
            appShell [ aboveTheFold canUseWebP ]

        Routes.Projects ->
            appShell [ projectsView projects activeProjectIndex ]

        Routes.ActiveProject slug ->
            appShell [ viewProject slug projects ]

        Routes.Contact ->
            appShell [ contact ]

        Routes.NotFound ->
            appShell [ contact ]

        Routes.Entrance ->
            appShell [ entrance form ]


navBar : Bool -> Html Msg
navBar navIsOpen =
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
                [ link { url = Routes.Projects, attrs = [ linkClass ], label = "Projects" } ]
            , li [ liClass ]
                [ link { url = Routes.Contact, attrs = [ linkClass ], label = "Contact" } ]
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
    button [ id "hamburger-button", onClick ToggleHamburger, attribute "aria-label" "Toggle navigation menu" ]
        [ span
            [ hamburgerClass ]
            [ span [ class "hamburger-inner" ] [] ]
        ]


makeHeroPictureSources : List (Html Msg)
makeHeroPictureSources =
    let
        baseSrcUrls =
            [ ( "/images/hero/hero-mobile", "(min-width: 320px) and (max-width: 1365px)" )
            , ( "/images/hero/hero-tablet", "(min-width: 1366px) and (max-width: 1919px)" )
            , ( "/images/hero/hero-full", "(min-width: 1920px)" )
            ]
    in
    List.append
        (List.map
            (\( src, med ) ->
                source
                    [ attribute "srcset" (String.append src ".webp")
                    , media med
                    , type_ "image/webp"
                    ]
                    []
            )
            baseSrcUrls
        )
        (List.map
            (\( src, med ) ->
                source
                    [ attribute "srcset" (String.append src ".jpg")
                    , media med
                    , type_ "image/jpg"
                    ]
                    []
            )
            baseSrcUrls
        )


aboveTheFold : Bool -> Html Msg
aboveTheFold canUseWebP =
    let
        bgImageClass =
            if canUseWebP then
                "webP"

            else
                ""
    in
    header [ class "h-screen w-screen flex flex-col items-center justify-center" ]
        [ node "picture"
            [ id "hero-img", class "relative" ]
            (makeHeroPictureSources
                ++ [ img [ alt "hero background image", src "/images/hero/hero-mobile.jpg" ] [] ]
            )
        , div [ id "hero-text", class "kinda-center" ]
            [ h1 [ class "text-white font-thin text-center leading-none whitespace-no-wrap massive-text tracking-wide" ] [ text "Christian Todd" ]
            , h3 [ class "text-white font-thin text-center italic" ] [ text "Web Developer" ]
            ]
        ]


projectsView : Array Project -> Int -> Html Msg
projectsView projects activeProjectIndex =
    case Array.get activeProjectIndex projects of
        Just project ->
            section [ id "projects" ]
                [ div [ class ("bg-center bg-no-repeat bg-cover bg-scroll h-screen w-screen " ++ project.bgClass) ] []
                , h1 [ class "leading-loose whitespace-no-wrap text-white kinda-center" ] [ project.title |> text ]
                , div [ class "view-project-container" ]
                    [ link
                        { url = project.slug |> Routes.ActiveProject
                        , attrs = [ class "view-project-link" ]
                        , label = "view project"
                        }
                    ]
                , button [ attribute "aria-label" "Next project", class "next-btn proj-btn", onClick (SwitchProject Next UserControlled (Time.millisToPosix 0)) ] [ img [ class "h-16 w-16", src "/images/icons/chevron.svg", alt "Next project" ] [] ]
                , button [ attribute "aria-label" "Previous project", class "prev-btn proj-btn", onClick (SwitchProject Back UserControlled (Time.millisToPosix 0)) ] [ img [ class "h-16 w-16", src "/images/icons/chevron.svg", alt "Previous project" ] [] ]
                ]

        Nothing ->
            div [] [ text "WeLP" ]


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
                [ a [ href "https://twitter.com/_chrstntdd", class anchorClass ] [ img [ src "/images/icons/twitter.svg", alt "twitter bird icon", class imgClass ] [] ] ]
            , li [ class listClass ]
                [ a [ href "https://github.com/chrstntdd", class anchorClass ] [ img [ src "/images/icons/github.svg", alt "Github mark icon", class imgClass ] [] ] ]
            , li [ class listClass ]
                [ a [ href "https://www.linkedin.com/in/christian-todd-b5b98513a/", class anchorClass ] [ img [ src "/images/icons/linkedin.svg", alt "LinkedIn text icon", class imgClass ] [] ] ]
            ]
        ]


entrance : Form -> Html Msg
entrance formState =
    let
        usernameHasContent =
            not (String.isEmpty formState.username)

        passwordHasContent =
            not (String.isEmpty formState.password)

        usernameClass =
            if usernameHasContent then
                "has-content"

            else
                ""

        passwordClass =
            if passwordHasContent then
                "has-content"

            else
                ""
    in
    main_ []
        [ div [ class "h-screen w-screen bg-blue" ]
            [ div [ class "h-50 w-50 p-2 shadow-md rounded kinda-center bg-white form-container flex-col-down" ]
                [ form [ onSubmit SignIn ]
                    [ legend [ class "text-xl my-2" ] [ Html.text "welcome" ]
                    , div [ class "input-container" ]
                        [ input [ id "username", type_ "text", onInput EnteredUsername, class usernameClass ] []
                        , label [ for "username" ]
                            [ Html.text "username"
                            ]
                        ]
                    , div [ class "input-container" ]
                        [ input [ id "password", type_ "password", onInput EnteredPassword, class passwordClass ] []
                        , label [ for "password" ]
                            [ Html.text "password"
                            ]
                        ]
                    , button [ class "text-sm font-semibold rounded my-4 px-4 py-1 leading-normal bg-white border border-blue text-blue hover:bg-blue hover:text-white trans-300ms-all", type_ "submit" ] [ Html.text "enter" ]
                    ]
                ]
            ]
        ]



{- UPDATE -}


type Msg
    = NoOp
    | ToggleHamburger
    | SwitchProject Direction ProjectSwitchBehavior Time.Posix
    | Tick Time.Posix
    | UrlChanged Url.Url
    | LinkClicked Browser.UrlRequest
    | EnteredUsername String
    | EnteredPassword String
    | SignIn


changeRouteTo : Maybe Route -> Model -> ( Model, Cmd Msg )
changeRouteTo maybeRoute model =
    case maybeRoute of
        Just Routes.Home ->
            ( { model | page = Routes.Home }, Cmd.none )

        Just Routes.Projects ->
            ( { model | page = Routes.Projects }, Cmd.none )

        Just (Routes.ActiveProject slug) ->
            ( { model | page = Routes.ActiveProject slug }, Cmd.none )

        Just Routes.Contact ->
            ( { model | page = Routes.Contact }, Cmd.none )

        Just Routes.Entrance ->
            ( { model | page = Routes.Entrance }, Cmd.none )

        Just Routes.NotFound ->
            ( { model | page = Routes.NotFound }, Cmd.none )

        Nothing ->
            ( { model | page = Routes.NotFound }, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        EnteredPassword password ->
            updateForm (\form -> { form | password = password }) model

        EnteredUsername username ->
            updateForm (\form -> { form | username = username }) model

        SignIn ->
            ( model, Cmd.none )

        LinkClicked urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, Navigation.pushUrl model.key (Url.toString url) )

                Browser.External href ->
                    ( model, Navigation.load href )

        UrlChanged url ->
            changeRouteTo (Routes.fromUrl url) model

        ToggleHamburger ->
            ( { model | navIsOpen = not model.navIsOpen }, Cmd.none )

        SwitchProject dir projectSwitchBehavior time ->
            let
                nextActiveProjectIndex : Int
                nextActiveProjectIndex =
                    case dir of
                        Back ->
                            if model.activeProjectIndex == 0 then
                                Array.length model.projects - 1

                            else
                                model.activeProjectIndex - 1

                        Next ->
                            if model.activeProjectIndex == Array.length model.projects - 1 then
                                0

                            else
                                model.activeProjectIndex + 1
            in
            case projectSwitchBehavior of
                Auto ->
                    ( { model | activeProjectIndex = nextActiveProjectIndex }, Cmd.none )

                UserControlled ->
                    ( { model
                        | activeProjectIndex = nextActiveProjectIndex
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
            if newMilliseconds == 0 then
                ( { model | autoSwitchProjectTimeout = Time.millisToPosix 5000, switchProjectBehavior = Auto }, Cmd.none )

            else
                ( { model | autoSwitchProjectTimeout = Time.millisToPosix newMilliseconds }, Cmd.none )



{- INIT -}
-- TODO: savedModel will eventually be the persisted model in sessionStorage
-- Once we persist the state, on init we should check for the session first before using the initialModel
-- Also, we have to convert the Zip List to a regular List for Javascript


init : Bool -> Url.Url -> Navigation.Key -> ( Model, Cmd Msg )
init doesSupportWebP url key =
    let
        maybeRoute =
            url |> Routes.fromUrl

        partialModel =
            initialModel ( key, url )
    in
    changeRouteTo maybeRoute { partialModel | canUseWebP = doesSupportWebP }



{- SUBSCRIPTIONS -}


subscriptions : Model -> Sub Msg
subscriptions model =
    if model.page == Routes.Projects then
        -- WE ONLY START THE SUBSCRIPTION TO CYCLE THROUGH PROJECTS IF WE'RE ON THE `PROJECTS` PAGE
        case model.switchProjectBehavior of
            Auto ->
                -- FOR AUTO BEHAVIOR, WE SEND A `SWITCHPROJECT` MSG TO ENABLE SWITCHING TO THE NEXT PROJECT
                Sub.batch [ every (5 * 1000) (SwitchProject Next Auto) ]

            UserControlled ->
                -- FOR USER CONTROLLED BEHAVIOR, WE SEND A `TICK` MSG EVERY SECOND TO TRACK THE TIMEOUT
                Sub.batch [ every 1000 Tick ]

    else
        Sub.none
