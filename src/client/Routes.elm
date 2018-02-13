module Routes exposing (Route(..), fromLocation, href, routeToString)

import Navigation
import Html exposing (Attribute)
import Html.Attributes as Attr
import UrlParser exposing ((</>), s, string, top, Parser, oneOf, parsePath, map)


type alias JWT =
    String


type Route
    = Home
    | About
    | Projects
    | ActiveProject String
    | Contact
    | NotFound


route : Parser (Route -> a) a
route =
    oneOf
        [ map Home (s "")
        , map About (s "about")
        , map Projects (s "projects")
        , map ActiveProject (s "projects" </> string)
        , map Contact (s "contact")
        ]


routeToString : Route -> JWT -> String
routeToString route jwt =
    {- JWT CAN BE PASSED IN FOR AUTHENTICATING ROUTES -}
    let
        pieces =
            case route of
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


href : Route -> Attribute msg
href route =
    {- BLANK STRING IS THE OPTIONAL JWT -}
    Attr.href (routeToString route "")


fromLocation : Navigation.Location -> Maybe Route
fromLocation location =
    if String.isEmpty location.pathname then
        Just Home
    else
        parsePath route location
