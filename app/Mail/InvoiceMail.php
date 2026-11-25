<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class InvoiceMail extends Mailable
{
    public function __construct(public Invoice $invoice) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Boleta '.$this->invoice->folio.' - Funeraria Cristo Rey');
    }

    public function content(): Content
    {
        return new Content(
            text: 'emails.invoice',
            with: ['invoice' => $this->invoice],
        );
    }
}
