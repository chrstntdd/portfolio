port module OutsideInfo exposing (..)

{- https://github.com/splodingsocks/a-very-im-port-ant-topic/blob/master/example/src/OutsideInfo.elm 
   Trying a new pattern for handling ports.
-}

import Json.Decode exposing (decodeValue)
import Json.Encode as Encode


type InfoForOutside
    = SaveModel
    | GetElementOffsetTop String
    | SetScrollTop Float


type InfoForElm
    = ScrollOrResize
    | GotOffsetTop


sendInfoOutside : InfoForOutside -> Cmd msg
sendInfoOutside info =
    case info of
        SaveModel ->
            infoForOutside { tag = "SaveModel", data = Encode.null }

        GetElementOffsetTop elementId ->
            infoForOutside { tag = "GetElementOffsetTop", data = Encode.null }

        SetScrollTop float ->
            infoForOutside { tag = "SetScrollTop", data = Encode.null }


getInfoFromOutside : (InfoForElm -> msg) -> (String -> msg) -> Sub msg
getInfoFromOutside tagger onError =
    infoForElm
        (\outsideInfo ->
            case outsideInfo.tag of
                "ScrollOrResize" ->
                    case decodeValue (Json.Decode.list entryDecoder) outsideInfo.data of
                        Ok entries ->
                            tagger <| ScrollOrResize entries

                        Err e ->
                            onError e
                "GotOffsetTop" ->

                    
                _ ->
                    onError <| "Unexpected info from the outside: " ++ toString outsideInfo
        )


type alias GenericOutsideData =
    { tag : String, data : Encode.Value }


port infoForOutside : GenericOutsideData -> Cmd msg


port infoForElm : (GenericOutsideData -> msg) -> Sub msg
