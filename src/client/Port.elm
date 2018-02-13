port module Port exposing (..)

import Json.Decode as D exposing (..)
import Json.Decode.Pipeline exposing (decode, required)
import Json.Encode as E exposing (..)


type alias ScreenData =
    { scrollTop : Float
    , pageHeight : Int
    , viewportHeight : Int
    , viewportWidth : Int
    }


type InfoForOutside
    = SaveModel
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


sendInfoOutside : InfoForOutside -> Cmd msg
sendInfoOutside info =
    case info of
        SaveModel ->
            infoForOutside { tag = "SaveModel", data = E.null }

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
