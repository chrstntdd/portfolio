module Routes exposing (..)

import Navigation
import UrlParser as Url exposing ((</>), (<?>), s, stringParam, top, Parser, oneOf, parsePath, map)


type alias JWT =
    String


type Page
    = Home
    | About
    | Portfolio
    | Contact


pageParser : Parser (Page -> a) a
pageParser =
    oneOf
        [ map Home (s "")
        , map About (s "about")
        , map Portfolio (s "portfolio")
        , map Contact (s "contact")
        ]


pageToPath : Page -> JWT -> String
pageToPath page jwt =
    {- JWT CAN BE PASSED IN FOR AUTHENTICATING ROUTES -}
    case page of
        Home ->
            "/"

        About ->
            "/about"

        Portfolio ->
            "/portfolio"

        Contact ->
            "/contact"


pathParser : Navigation.Location -> Maybe Page
pathParser location =
    parsePath pageParser location
