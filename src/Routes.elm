module Routes exposing (Route(..), routeToString)

import Browser.Navigation as Navigation
import Html exposing (Attribute)
import Html.Attributes as Attr
import Url.Parser exposing ((</>), Parser, map, oneOf, s, string, top)


type alias JWT =
    String


type Route
    = Home
    | About
    | Projects
    | ActiveProject String
    | Contact
    | NotFound


routeParser : Parser (Route -> a) a
routeParser =
    oneOf
        [ map Home (s "")
        , map About (s "about")
        , map Projects (s "projects")
        , map ActiveProject (s "projects" </> string)
        , map Contact (s "contact")
        ]


routeToString : Route -> JWT -> String
routeToString routeType jwt =
    {- JWT CAN BE PASSED IN FOR AUTHENTICATING ROUTES -}
    let
        pieces =
            case routeType of
                Home ->
                    [ "" ]

                About ->
                    [ "about" ]

                Projects ->
                    [ "projects" ]

                ActiveProject slug ->
                    [ "projects", slug ]

                Contact ->
                    [ "contact" ]

                NotFound ->
                    [ "404" ]
    in
    "/" ++ String.join "/" pieces



{- PUBLIC HELPERS -}
-- href : Route -> Attribute msg
-- href route =
--     {- BLANK STRING IS THE OPTIONAL JWT -}
--     Attr.href (routeToString route "")
