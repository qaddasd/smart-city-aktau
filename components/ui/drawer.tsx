'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

function Drawer(props: React.ComponentProps<'div'>) {
  return <div data-slot="drawer" {...props} />
}

function DrawerTrigger(props: React.ComponentProps<'button'>) {
  return <button data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DrawerClose(props: React.ComponentProps<'button'>) {
  return <button data-slot="drawer-close" {...props} />
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="drawer-overlay" className={cn('fixed inset-0 z-50', className)} {...props} />
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <div data-slot="drawer-content" className={cn('fixed z-50 flex flex-col bg-background', className)} {...props}>
        {children}
      </div>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="drawer-header" className={cn('p-4', className)} {...props} />
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="drawer-footer" className={cn('p-4', className)} {...props} />
}

function DrawerTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="drawer-title" className={cn('font-semibold', className)} {...props} />
}

function DrawerDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="drawer-description" className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
