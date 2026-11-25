<?php

namespace App\Mail;

use App\Models\Service;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ServiceOrderMail extends Mailable
{
    public function __construct(public Service $service) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Orden de servicio '.$this->service->code.' - Funeraria Cristo Rey');
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.service-order',
            with: ['service' => $this->service],
        );
    }
}
