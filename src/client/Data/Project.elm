module Data.Project exposing (..)

import Html exposing (..)
import Html.Attributes exposing (class, href, src, alt, style)


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
    in
        case currentProject of
            Nothing ->
                projectNotFound

            Just { title, repo, slug, demo, bgClass, description, imageData, techStack, tagline } ->
                div [ class ("project-card__" ++ slug) ]
                    [ header [ class bgClass ]
                        [ div [ class "header-text" ]
                            [ h1 [ class "heading-font" ] [ text title ]
                            , span [] []
                            , h2 [] [ text "scroll to discover" ]
                            ]
                        ]
                    , section [ class "about-project" ]
                        [ div [ class "info-container" ]
                            [ h1 [ class "project-tagline" ] [ text tagline ]
                            , div [ class "description" ]
                                [ h3 [] [ text "About" ]
                                , p [] [ text description ]
                                ]
                            , div [ class "tech-container" ]
                                [ h3 [] [ text "Technology" ]
                                , ul [] (List.map (\tech -> li [] [ text tech ]) techStack)
                                ]
                            , div [ class "links" ]
                                [ h3 [] [ text "Links" ]
                                , a [ href repo ] [ span [] [], text "View the source code" ]
                                , a [ href demo ] [ span [] [], text "View the demo" ]
                                ]
                            ]
                        ]
                    , div [ class "thumbnail-container" ]
                        [ ul [ class "proj-thumbnails" ] (List.map (\i -> li [] [ img [ src i.src, alt i.alt ] [] ]) imageData)
                        ]
                    ]
