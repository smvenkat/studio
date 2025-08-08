import LoadCraftK6Client from '@/components/loadcraft-k6-client';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-8 sm:p-8 md:p-12">
      <LoadCraftK6Client />
    </main>
  );
}
