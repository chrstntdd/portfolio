port module Main exposing (..)

import Html exposing (Html, a, div, h1, h3, h4, nav, header, i, img, li, main_, p, program, section, text, ul)
import Html.Attributes exposing (alt, class, for, href, id, placeholder, src, type_)
import Navigation exposing (Location, newUrl)
import Routes exposing (..)


-- Outgoing port


port scrollTop : Float -> Cmd msg


port offsetTop : String -> Cmd msg



-- Incoming port


port scrollOrResize : (ScreenData -> msg) -> Sub msg


port offsetTopVal : (ElementData -> msg) -> Sub msg



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
    , showNav : Bool
    , navOpen : Bool
    , page : Page
    , projects : List Project
    }


initialModel : Model
initialModel =
    { screenData = Nothing
    , elementData = Nothing
    , showNav = True
    , navOpen = False
    , page = Home
    , projects =
        [ { title = "Quantified"
          , imageData =
                [ { src = "q1-ss-min.png", alt = "" }
                , { src = "q2-ss-min.png", alt = "" }
                , { src = "q3-ss-min.png", alt = "" }
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
                [ { src = "vdb-ss-1-min.png", alt = "desc" }
                , { src = "vdb-ss-2-min.png", alt = "desc" }
                , { src = "vdb-ss-3-min.png", alt = "desc" }
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
                [ { src = "rn-ss-1-min.png", alt = "des" }
                , { src = "rn-ss-2-min.png", alt = "des" }
                , { src = "rn-ss-3-min.png", alt = "des" }
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
    }



{- VIEW -}


view : Model -> Html Msg
view model =
    let
        { page } =
            model
    in
        case page of
            Home ->
                div []
                    [ navBar model
                    , aboveTheFold model
                    , footer model
                    ]

            About ->
                div []
                    [ about model
                    , footer model
                    ]

            Portfolio ->
                div []
                    [ portfolio model
                    , footer model
                    ]

            Contact ->
                div []
                    [ contact model
                    , footer model
                    ]

            NotFound ->
                div []
                    [ text "Not FOUND"
                    ]


navBar : Model -> Html Msg
navBar model =
    nav [ class "" ]
        [ ul []
            [ li []
                [ a [ href "/home" ] [ text "Home" ]
                ]
            , li []
                [ a [ href "/about" ] [ text "About" ]
                ]
            , li []
                [ a [ href "/portfolio" ] [ text "Portfolio" ]
                ]
            , li []
                [ a [ href "/contact" ] [ text "Contact" ]
                ]
            ]
        ]


aboveTheFold : Model -> Html Msg
aboveTheFold model =
    header []
        [ div [ id "hero-img" ] []
        , div [ id "hero-text" ]
            [ h1 [] [ text "Christian Todd" ]
            , h3 [] [ text "Web Developer" ]
            ]
        ]


about : Model -> Html Msg
about model =
    main_ []
        [ section [ id "about" ]
            [ div [ id "about-container" ]
                [ h1 [] [ text "About me" ]
                , img [ src "/m-portrait.jpg", alt "portrait" ] []
                , p [] [ text "Hi, my name is Christian. I was first introduced to programming as a college student studying mechanical engineering.\n          I was initially fascinated by how vast the world of code is and everything there is to learn. I remain interested\n          by how there are countless ways to express a solution to a problem and the opportunities for constant iteration\n          upon what already exists. When I'm not busy programming, you can usually find me outside exploring the North End\n          beaches in my hometown of Virginia Beach. I also enjoy listening to my growing vinyl collection and sipping on\n          locally roasted coffee." ]
                ]
            ]
        ]


renderProjectCards : Project -> Html Msg
renderProjectCards project =
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


portfolio : Model -> Html Msg
portfolio model =
    let
        projectCards =
            List.map renderProjectCards model.projects
    in
        section [ id "portfolio" ]
            [ h1 [ id "port-header" ] [ text "Previous work" ]
            , div [ id "project-container" ] projectCards
            ]


contact : Model -> Html Msg
contact model =
    section [ id "contact" ]
        [ p [] [ text "Let's talk:" ]
        , p [ class "email" ] [ text "christian.todd7@gmail.com" ]
        , ul []
            [ li []
                [ a [ href "https://github.com/chrstntdd" ] [ i [ class "fa fa-github" ] [] ]
                ]
            , li []
                [ a [ href "https://www.linkedin.com/in/christian-todd-b5b98513a/" ] [ i [ class "fa fa-linkedin-square" ] [] ]
                ]
            , li []
                [ a [ href "https://twitter.com/_chrstntdd?lang=en" ] [ i [ class "fa fa-twitter" ] [] ]
                ]
            ]
        ]


footer : Model -> Html Msg
footer model =
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


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            model ! []

        GetOffset elementId ->
            model ! [ offsetTop elementId ]

        GotOffset data ->
            { model | elementData = Just data } ! [ scrollTop data.offsetTop ]

        OnScroll data ->
            { model | screenData = Just data } ! []

        UrlChange newLocation ->
            modelWithLocation newLocation model ! []



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
