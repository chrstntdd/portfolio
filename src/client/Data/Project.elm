module Data.Project exposing (..)

import Html exposing (..)
import Html.Attributes exposing (class)


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
    }


viewProject : String -> List Project -> Html msg
viewProject slug projects =
    let
        currentProject =
            List.filter (\p -> p.slug == slug) projects |> List.head
    in
        case currentProject of
            Nothing ->
                text "Project not found."

            Just { title, repo, demo, description, imageData, techStack } ->
                div [ class "" ]
                    [ p [] [ text title ]
                    , p [] [ text repo ]
                    , p [] [ text demo ]
                    , p [] [ text description ]
                    ]
