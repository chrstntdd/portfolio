port module Port exposing (..)

import Json.Decode as Decode exposing (..)
import Json.Decode.Pipeline exposing (decode, required)
import Json.Encode as Encode exposing (..)


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
        |> required "scrollTop" Decode.float
        |> required "pageHeight" Decode.int
        |> required "viewportHeight" Decode.int
        |> required "viewportWidth" Decode.int


sendInfoOutside : InfoForOutside -> Cmd msg
sendInfoOutside info =
    case info of
        SaveModel ->
            infoForOutside { tag = "SaveModel", data = Encode.null }

        ScrollTo elementId ->
            infoForOutside { tag = "ScrollTo", data = Encode.string elementId }

        LogErrorToConsole err ->
            infoForOutside { tag = "ErrorLogRequested", data = Encode.string err }


getInfoFromOutside : (InfoForElm -> msg) -> (String -> msg) -> Sub msg
getInfoFromOutside tagger onError =
    infoForElm
        (\outsideInfo ->
            case outsideInfo.tag of
                "ScrollOrResize" ->
                    case Decode.decodeValue screenDataDecoder outsideInfo.data of
                        Ok screenData ->
                            tagger <| ScrollOrResize screenData

                        Err e ->
                            onError e

                _ ->
                    onError <| "Unexpected info from the outside: " ++ toString outsideInfo
        )


type alias GenericOutsideData =
    {- COMMUNICATION IS HANDLED BY PATTERN MATCHING THE TAG FIELD AND SENDING SERIALIZED DATA -}
    { tag : String, data : Encode.Value }


port infoForOutside : GenericOutsideData -> Cmd msg


port infoForElm : (GenericOutsideData -> msg) -> Sub msg
