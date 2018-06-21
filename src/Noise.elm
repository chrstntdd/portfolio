module Noise exposing (PermutationTable, noise2d, permutationTable)

import Array exposing (Array)
import Bitwise exposing (and)
import List exposing (range)
import Random
import Random.Array exposing (shuffle)


f2 : Float
f2 =
    0.5 * (sqrt 3 - 1)


g2 : Float
g2 =
    (3 - sqrt 3) / 6


f3 : Float
f3 =
    1 / 3


g3 : Float
g3 =
    1 / 6


f4 : Float
f4 =
    (sqrt 5 - 1) / 4


g4 : Float
g4 =
    (5 - sqrt 5) / 20


get : Array a -> Int -> a
get arr i =
    case Array.get i arr of
        Just x ->
            x

        Nothing ->
            Debug.crash "Error getting item"


reverseArray : Array a -> Array a
reverseArray array =
    Array.toList array |> List.reverse |> Array.fromList


generatePermMod12 : Array Int -> Array Int
generatePermMod12 perm =
    Array.map (\i -> i % 12) perm


grad3 : Array Float
grad3 =
    Array.fromList
        [ 1
        , 1
        , 0
        , -1
        , 1
        , 0
        , 1
        , -1
        , 0
        , -1
        , -1
        , 0
        , 1
        , 0
        , 1
        , -1
        , 0
        , 1
        , 1
        , 0
        , -1
        , -1
        , 0
        , -1
        , 0
        , 1
        , 1
        , 0
        , -1
        , 1
        , 0
        , 1
        , -1
        , 0
        , -1
        , -1
        ]


getCornerOffset2d : Float -> Float -> ( Int, Int )
getCornerOffset2d x y =
    if x > y then
        ( 1, 0 )
    else
        ( 0, 1 )


getN2d : Float -> Float -> Int -> Int -> Array Int -> Array Int -> Float
getN2d x y i j perm permMod12 =
    let
        t =
            0.5 - x * x - y * y
    in
    if t < 0 then
        0
    else
        let
            gi =
                get permMod12 (i + get perm j) * 3

            tSquared =
                t * t
        in
        tSquared * tSquared * (get grad3 gi * x + get grad3 (gi + 1) * y)


{-| Permutation table that is needed to generate the noise value.
-}
type alias PermutationTable =
    { perm : Array Int, permMod12 : Array Int }


permGenerattor : Random.Generator (Array Int)
permGenerattor =
    range 0 255
        |> Array.fromList
        |> Random.Array.shuffle


{-| Genrate the permutation tables that are needed to calculate the noise value.
The function takes a seed and returns the table and a new seed.
-}
permutationTable : Random.Seed -> ( PermutationTable, Random.Seed )
permutationTable seed =
    let
        ( perm, seed_ ) =
            Random.step permGenerattor seed
                |> (\( list, seed ) -> ( Array.append list (reverseArray list), seed ))
    in
    ( { perm = perm, permMod12 = generatePermMod12 perm }, seed_ )


{-| Generates a noise value between `-1` and `1` based on the given x and y value and a seeded permutation table.
Using the same permutation table will always return the same result for the same coordinate.
-}
noise2d : PermutationTable -> Float -> Float -> Float
noise2d { perm, permMod12 } xin yin =
    let
        s =
            (xin + yin) * f2

        i =
            floor (xin + s)

        j =
            floor (yin + s)

        t =
            toFloat (i + j) * g2

        x0_ =
            toFloat i - t

        y0_ =
            toFloat j - t

        x0 =
            xin - x0_

        y0 =
            yin - y0_

        ( i1, j1 ) =
            getCornerOffset2d x0 y0

        x1 =
            x0 - toFloat i1 + g2

        y1 =
            y0 - toFloat j1 + g2

        x2 =
            x0 - 1 + 2 * g2

        y2 =
            y0 - 1 + 2 * g2

        ii =
            and i 255

        jj =
            and j 255

        n0 =
            getN2d x0 y0 ii jj perm permMod12

        n1 =
            getN2d x1 y1 (ii + i1) (jj + j1) perm permMod12

        n2 =
            getN2d x2 y2 (ii + 1) (jj + 1) perm permMod12
    in
    70 * (n0 + n1 + n2)
