import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-medium">AutoMes</h1>
      <p className="text-sm text-gray-500">Instagram DM Automation</p>
      <Button>Get Started</Button>
    </main>
  )
}