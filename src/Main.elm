port module Main exposing (..)

import Html exposing (Html, a, div, span, button, h1, h3, h4, nav, header, i, img, li, main_, p, program, section, text, ul)
import Html.Attributes exposing (alt, class, for, href, id, placeholder, src, type_)
import Html.Events exposing (onClick, onWithOptions)
import Navigation exposing (Location, newUrl)
import Json.Decode as Decode exposing (..)
import Routes exposing (..)


-- Outgoing port


port scrollTop : Float -> Cmd msg


port offsetTop : String -> Cmd msg



-- Incoming port


port scrollOrResize : (ScreenData -> msg) -> Sub msg


port offsetTopVal : (ElementData -> msg) -> Sub msg



{- UTILITY FUNCTIONS -}


onClickLink : msg -> Html.Attribute msg
onClickLink msg =
    {- FOR SINGLE PAGE NAVIGATION -}
    onWithOptions
        "click"
        { preventDefault = True
        , stopPropagation = False
        }
        (Decode.succeed msg)



{- MODEL -}


type alias ScreenData =
    { scrollTop : Float
    , pageHeight : Int
    , viewportHeight : Int
    , viewportWidth : Int
    }


type alias ElementData =
    { offsetTop : Float
    , id_ : String
    }


type alias ImageData =
    { src : String
    , alt : String
    }


type alias NavLink =
    { href_ : String
    , to : Page
    , label : String
    }


type alias Project =
    { title : String
    , imageData : List ImageData
    , techStack : List String
    , description : String
    , repo : String
    , demo : String
    }


type alias Model =
    { screenData : Maybe ScreenData
    , elementData : Maybe ElementData
    , navIsOpen : Bool
    , page : Page
    , navLinks : List NavLink
    , projects : List Project
    }


initialModel : Model
initialModel =
    { screenData = Nothing
    , elementData = Nothing
    , navIsOpen = False
    , page = Home
    , projects =
        [ { title = "Quantified"
          , imageData =
                [ { src = "/assets/q1-ss-min.png", alt = "" }
                , { src = "/assets/q2-ss-min.png", alt = "" }
                , { src = "/assets/q3-ss-min.png", alt = "" }
                ]
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
        , { title = "VinylDB"
          , imageData =
                [ { src = "/assets/vdb-ss-1-min.png", alt = "desc" }
                , { src = "/assets/vdb-ss-2-min.png", alt = "desc" }
                , { src = "/assets/vdb-ss-3-min.png", alt = "desc" }
                ]
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
          , imageData =
                [ { src = "/assets/rn-ss-1-min.png", alt = "des" }
                , { src = "/assets/rn-ss-2-min.png", alt = "des" }
                , { src = "/assets/rn-ss-3-min.png", alt = "des" }
                ]
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
        [ { href_ = "/", to = Home, label = "Home" }
        , { href_ = "/about", to = About, label = "About" }
        , { href_ = "/portfolio", to = Portfolio, label = "Portfolio" }
        , { href_ = "/contact", to = Contact, label = "Contact" }
        ]
    }



{- VIEW -}


view : Model -> Html Msg
view model =
    let
        { page, projects, navIsOpen, screenData, navLinks } =
            model

        viewportWidth : Int
        viewportWidth =
            case screenData of
                Just screenData ->
                    screenData.viewportWidth

                Nothing ->
                    0

        appShell : List (Html Msg) -> Html Msg
        appShell rest =
            div [ class "__page-wrapper__" ]
                (List.append
                    [ navBar navIsOpen viewportWidth navLinks ]
                    rest
                )
    in
        case page of
            Home ->
                appShell [ aboveTheFold navIsOpen ]

            About ->
                appShell [ about, footer ]

            Portfolio ->
                appShell [ portfolio projects, footer ]

            Contact ->
                appShell [ contact, footer ]


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
            [ ul [ id "nav-list", class "pa0 ma0 h-100 flex items-center" ]
                (List.map renderNavLink navLinks)
            , if viewportWidth > 768 then
                {- DONT SHOW HAMBURGER ON DESKTOP -}
                Html.text ""
              else
                hamburgerMenu navIsOpen
            ]


renderNavLink : NavLink -> Html Msg
renderNavLink { href_, to, label } =
    li []
        [ a [ href href_, onClickLink (NavigateTo to) ] [ text label ]
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
                , img [ src "/m-portrait.jpg", alt "portrait" ] []
                , p [] [ text "Hi, my name is Christian. I was first introduced to programming as a college student studying mechanical engineering.\n          I was initially fascinated by how vast the world of code is and everything there is to learn. I remain interested\n          by how there are countless ways to express a solution to a problem and the opportunities for constant iteration\n          upon what already exists. When I'm not busy programming, you can usually find me outside exploring the North End\n          beaches in my hometown of Virginia Beach. I also enjoy listening to my growing vinyl collection and sipping on\n          locally roasted coffee." ]
                ]
            ]
        ]


portfolio : List Project -> Html Msg
portfolio projects =
    let
        projectCards =
            List.map renderProjectCard projects
    in
        section [ id "portfolio" ]
            [ h1 [ id "port-header" ] [ text "Previous work" ]
            , div [ id "project-container" ] projectCards
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
                [ a [ href "https://github.com/chrstntdd" ] [ text "github" ]
                ]
            , li []
                [ a [ href "https://www.linkedin.com/in/christian-todd-b5b98513a/" ] [ text "linkedIn" ]
                ]
            , li []
                [ a [ href "https://twitter.com/_chrstntdd?lang=en" ] [ text "twitter" ]
                ]
            ]
        ]


footer : Html Msg
footer =
    Html.footer [ class "content-info" ]
        [ p [] [ text "Christian Todd | 2018" ]
        ]



{- UPDATE -}


type Msg
    = NoOp
    | OnScroll ScreenData
    | GetOffset String
    | GotOffset ElementData
    | UrlChange Location
    | ToggleHamburger
    | NavigateTo Page


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            model ! []

        NavigateTo page ->
            {- THE SECOND ARGUMENT TO pageToPath IS A JWT FOR VALIDATION, IF NEEDED -}
            { model | navIsOpen = False } ! [ newUrl (Routes.pageToPath page "") ]

        GetOffset elementId ->
            model ! [ offsetTop elementId ]

        GotOffset data ->
            { model | elementData = Just data } ! [ scrollTop data.offsetTop ]

        OnScroll data ->
            { model | screenData = Just data } ! []

        UrlChange newLocation ->
            modelWithLocation newLocation model ! []

        ToggleHamburger ->
            { model | navIsOpen = not model.navIsOpen } ! []



{- SUBSCRIPTIONS -}


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ scrollOrResize OnScroll, offsetTopVal GotOffset ]



{- MAIN -}


init : Location -> ( Model, Cmd Msg )
init location =
    let
        page =
            location |> Routes.pathParser |> Maybe.withDefault Home
    in
        case page of
            Home ->
                { initialModel
                    | page = Home
                }
                    ! []

            _ ->
                modelWithLocation location initialModel ! []


modelWithLocation : Location -> Model -> Model
modelWithLocation location model =
    let
        page =
            location
                |> Routes.pathParser
                |> Maybe.withDefault Home
    in
        { model | page = page }


main : Program Never Model Msg
main =
    Navigation.program UrlChange
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
