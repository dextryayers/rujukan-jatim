<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccreditationController;
use App\Http\Controllers\IndicatorController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\VisitorAnalyticsController;
use App\Http\Controllers\ActivityLogController;

Route::options('/{any}', function () {
    return response()->noContent();
})->where('any', '.*');

Route::get('/ping', function () {
    return response()->json(['message' => 'pong from Laravel']);
});

Route::get('/akreditasi', [AccreditationController::class, 'index']);
Route::get('/akreditasi/history', [AccreditationController::class, 'history']);
Route::get('/indikators', [IndicatorController::class, 'index']);
Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
Route::post('/analytics/track', [VisitorAnalyticsController::class, 'track']);
Route::get('/analytics/stats', [VisitorAnalyticsController::class, 'stats']);
Route::get('/analytics/summary', [VisitorAnalyticsController::class, 'summary']);

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth.token')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/activity/logs', [ActivityLogController::class, 'index']);
});

Route::middleware('auth.token:admin')->group(function () {
    Route::post('/akreditasi', [AccreditationController::class, 'store']);

    Route::post('/indikators', [IndicatorController::class, 'store']);
    Route::put('/indikators/{indicator}', [IndicatorController::class, 'update']);
    Route::delete('/indikators/{indicator}', [IndicatorController::class, 'destroy']);
    Route::post('/indikators/replace', [IndicatorController::class, 'replace']);

    Route::post('/documents', [DocumentController::class, 'store']);
    Route::post('/documents/{documentId}', [DocumentController::class, 'update']);
    Route::delete('/documents/{documentId}', [DocumentController::class, 'destroy']);

    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
    Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
});
