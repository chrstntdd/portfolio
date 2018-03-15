module Data.Project exposing (Project, viewProject)

import Html exposing (..)
import Html.Attributes exposing (alt, class, href, src, style)


type alias ImageData =
    { src : String
    , alt : String
    }


type alias Project =
    { title : String
    , slug : String
    , imageData : List ImageData
    , bgClass : String
    , techStack : List String
    , description : String
    , repo : String
    , demo : String
    , tagline : String
    }


projectNotFound : Html msg
projectNotFound =
    div []
        [ text "Project not found" ]


viewProject : String -> List Project -> Html msg
viewProject slug projects =
    let
        currentProject =
            List.filter (\p -> p.slug == slug) projects |> List.head

        anchorClass =
            class "leading-normal no-underline mb-2"
    in
    case currentProject of
        Nothing ->
            projectNotFound

        Just { title, repo, slug, demo, bgClass, description, imageData, techStack, tagline } ->
            div [ class ("project-card__" ++ slug ++ " text-lg") ]
                [ header [ class (bgClass ++ " h-screen bg-cover bg-center bg-no-repeat ") ]
                    [ div [ class "header-text-container kinda-center flex flex-col justify-center items-center" ]
                        [ h1 [ class "text-white leading-loose whitespace-no-wrap" ] [ text title ]
                        , span [] []
                        , h2 [ class "text-center whitespace-no-wrap font-normal" ] [ text "scroll to discover" ]
                        ]
                    ]
                , section [ class ("about-project" ++ " " ++ "min-h-screen min-w-screen flex flex-col justify-center items-center") ]
                    [ div [ class "info-container justify-center items-center" ]
                        [ h1 [ class "project-tagline" ] [ text tagline ]
                        , div [ class "description p-4 text-center sm:text-left" ]
                            [ h3 [ class "font-medium" ] [ text "About" ]
                            , p [] [ text description ]
                            ]
                        , div [ class "tech-container p-4 w-full" ]
                            [ h3 [ class "font-medium" ] [ text "Technology" ]
                            , ul [] (List.map (\tech -> li [] [ text tech ]) techStack)
                            ]
                        , div [ class ("links" ++ " " ++ "flex flex-col h-full w-full p-4") ]
                            [ h3 [ class "text-center sm:text-left font-medium" ] [ text "Links" ]
                            , div [ class "links__container flex justify-around sm:flex-col" ]
                                [ a [ href repo, anchorClass ] [ span [ class "link-accent" ] [], text "view source" ]
                                , a [ href demo, anchorClass ] [ span [ class "link-accent" ] [], text "view demo" ]
                                ]
                            ]
                        ]
                    ]
                , div [ class "thumbnail-container" ]
                    [ ul [ class "proj-thumbnails flex flex-col items-center justify-center m-0 p-0" ] (List.map (\i -> li [ class "list-reset p-2" ] [ img [ src i.src, alt i.alt ] [] ]) imageData)
                    ]
                ]
