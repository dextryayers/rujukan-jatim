<?php

return [
    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('APP_URL'),
        'https://dinkes.haniipp.space',
        'https://www.dinkes.haniipp.space',
        'https://api.dinkes.haniipp.space',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]),

    'allowed_origins_patterns' => [
        '#^https?:\/\/([a-z0-9-]+\.)?haniipp\.space$#i',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Content-Disposition',
    ],

    'max_age' => 300,

    'supports_credentials' => true,
];
