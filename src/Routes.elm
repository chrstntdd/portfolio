module Routes exposing (..)

import Navigation
import UrlParser as Url exposing ((</>), (<?>), s, stringParam, top, Parser, oneOf, parsePath, map)


type Page
    = Home
    | About
    | Portfolio
    | Contact
    | NotFound


pageParser : Parser (Page -> a) a
pageParser =
    oneOf
        [ map Home (s "")
        , map About (s "about")
        , map Portfolio (s "portfolio")
        , map Contact (s "contact")
        ]


pageToPath : Page -> String -> String
pageToPath page jwt =
    case page of
        Home ->
            "/"

        About ->
            "/about"

        Portfolio ->
            "/portfolio"

        Contact ->
            "/contact"

        NotFound ->
            "/404"


pathParser : Navigation.Location -> Maybe Page
pathParser location =
    parsePath pageParser location
