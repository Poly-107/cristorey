<?php

use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FleetController;
use App\Http\Controllers\FuneralPackageController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', [LandingController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Módulos operativos: gerencia, encargado y mostrador
    Route::middleware('role:dueno,encargado,mostrador')->group(function () {
        // Módulo de Servicios Funerarios: catálogo de paquetes y cotizaciones.
        Route::get('servicios/cotizaciones', [QuoteController::class, 'index'])->name('servicios.cotizaciones.index');
        Route::post('servicios/cotizaciones', [QuoteController::class, 'store'])->name('servicios.cotizaciones.store');
        Route::put('servicios/cotizaciones/{quote}', [QuoteController::class, 'update'])->name('servicios.cotizaciones.update');
        Route::delete('servicios/cotizaciones/{quote}', [QuoteController::class, 'destroy'])->name('servicios.cotizaciones.destroy');
        Route::post('servicios/cotizaciones/{quote}/contratar', [QuoteController::class, 'contratar'])->name('servicios.cotizaciones.contratar');

        Route::resource('servicios', FuneralPackageController::class)
            ->except(['show', 'create', 'edit'])
            ->names('servicios')
            ->parameters(['servicios' => 'funeralPackage']);

        Route::resource('expedientes', ServiceController::class)
            ->except(['show', 'create', 'edit'])
            ->names('expedientes')->parameters(['expedientes' => 'service']);
        Route::get('expedientes/{service}/imprimir', [ServiceController::class, 'print'])->name('expedientes.print');

        Route::resource('catalogo', CatalogController::class)
            ->except(['show', 'create', 'edit'])
            ->names('catalogo')->parameters(['catalogo' => 'catalogItem']);

        Route::resource('reservas', ReservationController::class)
            ->except(['show', 'create', 'edit'])
            ->names('reservas')->parameters(['reservas' => 'reservation']);
        Route::post('reservas/{reservation}/abonos', [ReservationController::class, 'payment'])->name('reservas.payment');

        Route::get('calendario', [CalendarController::class, 'index'])->name('calendario.index');
        Route::post('calendario', [CalendarController::class, 'store'])->name('calendario.store');
        Route::put('calendario/{calendarEvent}', [CalendarController::class, 'update'])->name('calendario.update');
        Route::delete('calendario/{calendarEvent}', [CalendarController::class, 'destroy'])->name('calendario.destroy');
    });

    // Emisión de boletas: gerencia y mostrador
    Route::middleware('role:dueno,mostrador')->group(function () {
        Route::resource('boletas', InvoiceController::class)
            ->except(['show', 'create', 'edit'])
            ->names('boletas')->parameters(['boletas' => 'invoice']);
        Route::get('boletas/{invoice}/imprimir', [InvoiceController::class, 'print'])->name('boletas.print');
    });

    // Informes y ausencias: gerencia y encargado
    Route::middleware('role:dueno,encargado')->group(function () {
        Route::get('informes', [ReportController::class, 'index'])->name('informes.index');
        Route::get('informes/imprimir', [ReportController::class, 'print'])->name('informes.print');
        Route::get('informes/exportar/{format}', [ReportController::class, 'export'])->name('informes.export');

        Route::resource('ausencias', AbsenceController::class)
            ->except(['show', 'create', 'edit'])
            ->names('ausencias')->parameters(['ausencias' => 'absence']);
    });

    // Flota: lectura y cambio de estado para todos los roles de flota; gestión solo para gerencia/encargado
    Route::middleware('role:dueno,encargado,chofer')->group(function () {
        Route::get('flota', [FleetController::class, 'index'])->name('flota.index');
        Route::post('flota/recorridos/{trip}/iniciar', [FleetController::class, 'start'])->name('flota.trips.start');
        Route::post('flota/recorridos/{trip}/finalizar', [FleetController::class, 'finish'])->name('flota.trips.finish');
    });

    Route::middleware('role:dueno,encargado')->group(function () {
        Route::post('flota/vehiculos', [FleetController::class, 'storeVehicle'])->name('flota.vehicles.store');
        Route::post('flota/recorridos', [FleetController::class, 'storeTrip'])->name('flota.trips.store');
        Route::delete('flota/recorridos/{trip}', [FleetController::class, 'destroyTrip'])->name('flota.trips.destroy');
    });

    // Gestión de colaboradores: exclusivo de gerencia
    Route::middleware('role:dueno')->group(function () {
        Route::resource('usuarios', UserController::class)
            ->except(['show', 'create', 'edit'])
            ->names('usuarios')->parameters(['usuarios' => 'user']);
    });
});

require __DIR__.'/settings.php';
