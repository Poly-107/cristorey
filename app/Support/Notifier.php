<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class Notifier
{
    /**
     * Envía un correo opcional sin impedir que se guarde el registro principal.
     */
    public static function send(?string $email, object $mailable): bool
    {
        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        try {
            Mail::to($email)->send($mailable);

            return true;
        } catch (Throwable $exception) {
            Log::warning('No se pudo enviar el correo opcional: '.$exception->getMessage());

            return false;
        }
    }
}
