'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export function DevTools() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }
  
  const handleConfirmUser = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/dev/confirm-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'User confirmed successfully',
          variant: 'default',
        });
        setEmail('');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to confirm user',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-yellow-400 border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <div className="bg-yellow-400 text-black text-xs rounded px-2 py-1 mr-2">DEV</div>
            Development Tools
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            These tools are only visible in development mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-2">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Confirm User By Email</Label>
            <div className="flex space-x-2">
              <Input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-8 text-sm"
              />
              <Button 
                size="sm" 
                onClick={handleConfirmUser}
                disabled={isLoading}
              >
                {isLoading ? 'Confirming...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            Use these tools to help with development and testing
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}