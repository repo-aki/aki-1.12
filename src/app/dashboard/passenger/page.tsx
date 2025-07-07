
"use client";

import React, { useState } from 'react';
import AppHeader from '@/components/app-header';
import TripForm from '@/components/trip-form';

export default function PassengerDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex flex-col flex-grow items-center justify-start pt-24 px-4 w-full">
        <TripForm />
      </main>
    </div>
  );
}
