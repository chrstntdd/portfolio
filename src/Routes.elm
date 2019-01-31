module Routes exposing (Route(..), fromUrl, href, routeToString)

import Browser.Navigation as Navigation
import Html exposing (Attribute)
import Html.Attributes as Attr
import Url exposing (Url)
import Url.Parser as Parser exposing ((</>), Parser, map, oneOf, s, string, top)


type alias JWT =
    String


type Route
    = Home
    | Projects
    | ActiveProject String
    | Contact
    | NotFound
    | Entrance


routeParser : Parser (Route -> a) a
routeParser =
    oneOf
        [ map Home (s "")
        , map Projects (s "projects")
        , map ActiveProject (s "projects" </> string)
        , map Contact (s "contact")
        , map Entrance (s "entrance")
        ]


routeToString : Route -> JWT -> String
routeToString routeType jwt =
    {- JWT CAN BE PASSED IN FOR AUTHENTICATING ROUTES -}
    let
        pieces =
            case routeType of
                Home ->
                    [ "" ]

                Projects ->
                    [ "projects" ]

                ActiveProject slug ->
                    [ "projects", slug ]

                Contact ->
                    [ "contact" ]

                NotFound ->
                    [ "404" ]

                Entrance ->
                    [ "entrance" ]
    in
    "/" ++ String.join "/" pieces


fromUrl : Url -> Maybe Route
fromUrl url =
    if url.path == "/" then
        Just Home

    else
        Parser.parse routeParser url



{- PUBLIC HELPERS -}


href : Route -> Attribute msg
href route =
    {- BLANK STRING IS THE OPTIONAL JWT -}
    Attr.href (routeToString route "")
