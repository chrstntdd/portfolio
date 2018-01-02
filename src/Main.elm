port module Main exposing (..)

import Html exposing (Html, div, p, program, text)
import Html.Attributes exposing (class, for, id, placeholder, type_)


-- import Html.Events exposing (..)
{- MODEL -}


type alias ScreenData =
    { scrollTop : Float
    , pageHeight : Int
    , viewportHeight : Int
    , viewportWidth : Int
    }


type alias Model =
    { screenData : Maybe ScreenData
    }


initialModel : Model
initialModel =
    { screenData = Nothing
    }



{- VIEW -}


view : Model -> Html Msg
view model =
    div []
        [ p [ class "bg-near-white" ] [ text "Hello, WERLD" ]
        ]



{- UPDATE -}


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            model ! []



{- SUBSCRIPTIONS -}


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none



{- MAIN -}


init : ( Model, Cmd Msg )
init =
    initialModel ! []


main : Program Never Model Msg
main =
    program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
