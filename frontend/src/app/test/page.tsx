'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestPage() {
  return (
    <div className="min-h-screen p-8 bg-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          <span className="gradient-text">TalkStake</span> UI Test
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Testing different button styles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="default">Default Button</Button>
              <Button variant="gradient">Gradient Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Glass Effect Card</CardTitle>
              <CardDescription>This card has a glass effect with backdrop blur</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300">
                This demonstrates the glass effect styling with proper backdrop blur and transparency.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl gradient-text mb-4">Gradient Text Example</h2>
          <p className="text-zinc-400">If you can see styled buttons, cards, and gradient text, the CSS is working!</p>
        </div>
      </div>
    </div>
  )
}