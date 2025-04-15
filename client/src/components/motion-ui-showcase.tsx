'use client';

import React, { useState } from 'react';
import { TextShimmer } from '@/components/core/text-shimmer';
import { TextShimmerWave } from '@/components/core/text-shimmer-wave';
import { TextScramble } from '@/components/core/text-scramble';
import { TransitionPanel } from '@/components/core/transition-panel';
import {
  Activity,
  Component,
  HomeIcon,
  Mail,
  Package,
  ScrollText,
  SunMoon,
} from 'lucide-react';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/core/dock';
import { AnimatedBackground } from '@/components/core/animated-background';
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/core/dialog';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from '@/components/core/disclosure';

export default function MotionUIShowcase() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  
  const dockItems = [
    {
      title: 'Home',
      icon: <HomeIcon className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
    },
    {
      title: 'Products',
      icon: <Package className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
    },
    {
      title: 'Components',
      icon: <Component className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
    },
    {
      title: 'Activity',
      icon: <Activity className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
    },
    {
      title: 'Email',
      icon: <Mail className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
    },
    {
      title: 'Theme',
      icon: <SunMoon className='h-full w-full text-neutral-600 dark:text-neutral-300' />,
    },
  ];
  
  const tabsItems = [
    {
      title: 'Profile',
      subtitle: 'Your Personal Information',
      content:
        'Manage your profile details and account settings. Update your photo, change your username, or modify your preferences.',
    },
    {
      title: 'Chats',
      subtitle: 'Conversations & Messages',
      content:
        'View your chat history, manage conversations, and configure message settings. Archive old chats or pin important ones to the top.',
    },
    {
      title: 'Settings',
      subtitle: 'Application Configuration',
      content:
        'Adjust app behavior, notifications, and privacy settings. Control who can see your status, profile photo, and when you were last online.',
    },
  ];
  
  const TABS = ['Home', 'About', 'Services', 'Contact'];

  return (
    <div className="p-6 flex flex-col space-y-16 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Motion UI Components Showcase</h1>
      
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Text Animation Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Text Shimmer</h3>
            <TextShimmer className="font-mono text-sm" duration={2}>
              Loading messages...
            </TextShimmer>
          </div>
          
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Text Shimmer Wave</h3>
            <TextShimmerWave className="font-mono text-sm" duration={2}>
              Syncing contacts...
            </TextShimmerWave>
          </div>
          
          <div className="p-4 border rounded-md">
            <h3 className="font-medium mb-2">Text Scramble</h3>
            <TextScramble className="font-mono text-sm uppercase">
              ENCRYPTING MESSAGE
            </TextScramble>
          </div>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Transition Panel</h2>
        <div className="mb-4 flex space-x-2">
          {tabsItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveTabIndex(index)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                activeTabIndex === index
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="overflow-hidden border-t border-gray-200">
          <TransitionPanel
            activeIndex={activeTabIndex}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            variants={{
              enter: { opacity: 0, y: -20, filter: 'blur(4px)' },
              center: { opacity: 1, y: 0, filter: 'blur(0px)' },
              exit: { opacity: 0, y: 20, filter: 'blur(4px)' },
            }}
          >
            {tabsItems.map((item, index) => (
              <div key={index} className="py-3">
                <h3 className="mb-2 font-medium text-gray-800">
                  {item.subtitle}
                </h3>
                <p className="text-gray-600">{item.content}</p>
              </div>
            ))}
          </TransitionPanel>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Animated Background</h2>
        <div className="flex flex-row justify-center">
          <AnimatedBackground
            defaultValue={TABS[0]}
            className="rounded-lg bg-gray-100"
            transition={{
              type: 'spring',
              bounce: 0.2,
              duration: 0.3,
            }}
            enableHover
          >
            {TABS.map((tab, index) => (
              <button
                key={index}
                data-id={tab}
                type="button"
                className="px-3 py-1.5 text-gray-600 transition-colors duration-300 hover:text-gray-900"
              >
                {tab}
              </button>
            ))}
          </AnimatedBackground>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Dialog</h2>
        <div className="flex justify-center">
          <Dialog>
            <DialogTrigger className="bg-emerald-500 px-4 py-2 text-sm text-white hover:bg-emerald-600 rounded-md">
              Create New Chat
            </DialogTrigger>
            <DialogContent className="w-full max-w-md bg-white p-6 rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-gray-900">
                  Start a New Conversation
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Select a contact or create a new group chat.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex flex-col space-y-4">
                <input
                  type="text"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-base text-gray-900 outline-hidden focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                  placeholder="Search contacts..."
                />
                <button
                  className="inline-flex items-center justify-center self-end rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                  type="button"
                >
                  Start Chat
                </button>
              </div>
              <DialogClose />
            </DialogContent>
          </Dialog>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Disclosure</h2>
        <div className="flex justify-center">
          <Disclosure className="w-full max-w-md rounded-md border border-gray-200 px-4">
            <DisclosureTrigger>
              <button className="w-full py-3 text-left text-sm font-medium flex justify-between items-center" type="button">
                <span>Chat Settings</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
            </DisclosureTrigger>
            <DisclosureContent>
              <div className="overflow-hidden pb-4">
                <div className="pt-2 text-sm text-gray-600 space-y-2">
                  <p className="flex items-center justify-between">
                    <span>Notifications</span>
                    <span className="h-5 w-10 rounded-full bg-emerald-500"></span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Media Autodownload</span>
                    <span className="h-5 w-10 rounded-full bg-gray-300"></span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Chat Backup</span>
                    <span className="h-5 w-10 rounded-full bg-emerald-500"></span>
                  </p>
                </div>
              </div>
            </DisclosureContent>
          </Disclosure>
        </div>
      </section>
      
      <section className="bg-white p-6 rounded-lg shadow-md relative h-32">
        <h2 className="text-xl font-semibold mb-4">Interactive Dock</h2>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Dock className="items-end">
            {dockItems.map((item, idx) => (
              <DockItem
                key={idx}
                className="aspect-square rounded-full bg-gray-100"
              >
                <DockLabel>{item.title}</DockLabel>
                <DockIcon>{item.icon}</DockIcon>
              </DockItem>
            ))}
          </Dock>
        </div>
      </section>
    </div>
  );
}