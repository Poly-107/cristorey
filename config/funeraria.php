<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Valores de referencia de la funeraria
    |--------------------------------------------------------------------------
    |
    | La UF y la cantidad de UF de la Cuota Mortuoria se dejan configurables
    | para poder ajustarlas al cambiar el año sin tocar el código.
    |
    */

    'uf_value' => (int) env('FUNERARIA_UF_VALUE', 39000),

    'afp_uf' => (int) env('FUNERARIA_AFP_UF', 15),
];
