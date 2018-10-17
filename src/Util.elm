module Util exposing (unwrap)

{-| Take a default value, a function and a `Maybe`.
Return the default value if the `Maybe` is `Nothing`.
If the `Maybe` is `Just a`, apply the function on `a` and return the `b`.
That is, `unwrap d f` is equivalent to `Maybe.map f >> Maybe.withDefault d`.
-}


unwrap : b -> (a -> b) -> Maybe a -> b
unwrap d f m =
    case m of
        Nothing ->
            d

        Just a ->
            f a
