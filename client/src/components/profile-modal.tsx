import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Check, X } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateStatusMutation, updateProfileImageMutation } = useAuth();
  const { updateProfile } = useSupabaseAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState(user?.status || 'Available');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  // In development mode all users are treated as dev users
  const [isDevMode] = useState(import.meta.env.DEV);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle status update
  const handleStatusUpdate = () => {
    if (status.trim() === '') {
      setStatus(user?.status || 'Available');
      return;
    }

    if (isDevMode) {
      // In dev mode, update the simulated user
      updateProfile({ status: status.trim() })
        .then(() => {
          setIsEditingStatus(false);
          toast({
            title: 'Status updated',
            description: 'Your status has been updated in development mode.',
          });
        });
    } else {
      // Normal update through API
      updateStatusMutation.mutate(status, {
        onSuccess: () => {
          setIsEditingStatus(false);
        },
        onError: () => {
          setStatus(user?.status || 'Available');
        }
      });
    }
  };

  // Handle name update
  const handleNameUpdate = () => {
    if (displayName.trim() === '') {
      setDisplayName(user?.displayName || '');
      return;
    }

    if (isDevMode) {
      // In dev mode, update the simulated user
      updateProfile({ name: displayName.trim() })
        .then(() => {
          setIsEditingName(false);
          toast({
            title: 'Name updated',
            description: 'Your name has been updated in development mode.',
          });
        });
    }
  };

  // Handle profile image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size should be less than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    if (isDevMode) {
      // In dev mode, just update the profile with the data URL
      reader.onloadend = () => {
        const base64data = reader.result;
        updateProfile({ profileImage: base64data })
          .then(() => {
            toast({
              title: 'Profile image updated',
              description: 'Your profile image has been updated in development mode.',
            });
          });
      };
    } else {
      // Normal upload through API
      updateProfileImageMutation.mutate(file, {
        onError: () => {
          setImagePreview(null);
        }
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile image */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt={user?.displayName || 'User'} />
                ) : user?.profileImage ? (
                  <AvatarImage src={user.profileImage} alt={user.displayName} />
                ) : (
                  <AvatarFallback className="text-2xl bg-[#25D366] text-white">
                    {user?.displayName?.substring(0, 2) || user?.username?.substring(0, 2) || 'U'}
                  </AvatarFallback>
                )}

                <button 
                  className="absolute bottom-0 right-0 bg-[#25D366] text-white p-1.5 rounded-full shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </button>
              </Avatar>
            </div>

            {isEditingName ? (
              <div className="mt-4 flex items-center gap-2">
                <Input 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 text-center"
                  placeholder="Your name"
                  maxLength={30}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNameUpdate}
                >
                  <Check className="h-5 w-5 text-[#25D366]" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setDisplayName(user?.displayName || '');
                    setIsEditingName(false);
                  }}
                >
                  <X className="h-5 w-5 text-[#8696A0]" />
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center">
                <div className="flex items-center">
                  <h3 className="font-medium text-[#111B21]">{user?.displayName || displayName}</h3>
                  {isDevMode && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-1 text-[#34B7F1] h-auto py-0 px-1"
                      onClick={() => setIsEditingName(true)}
                    >
                      <span className="sr-only">Edit name</span>
                      <Check size={12} />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-[#8696A0]">{user?.username}</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-[#8696A0] text-sm">Status</Label>
            
            {isEditingStatus ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1"
                  placeholder="What's happening right now?"
                  maxLength={50}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending}
                >
                  <Check className="h-5 w-5 text-[#25D366]" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setStatus(user?.status || 'Available');
                    setIsEditingStatus(false);
                  }}
                >
                  <X className="h-5 w-5 text-[#8696A0]" />
                </Button>
              </div>
            ) : (
              <div 
                className="p-3 bg-[#F0F2F5] rounded-md flex justify-between items-center cursor-pointer"
                onClick={() => setIsEditingStatus(true)}
              >
                <span className="text-[#111B21]">{status}</span>
                <Button variant="ghost" size="sm" className="text-[#34B7F1] h-auto py-1">
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Phone/Email */}
          <div className="space-y-2">
            <Label className="text-[#8696A0] text-sm">Username</Label>
            <div className="p-3 bg-[#F0F2F5] rounded-md text-[#111B21]">
              {user?.username}
            </div>
            <p className="text-xs text-[#8696A0]">
              This is your unique username. Other users can find you by this name.
            </p>
          </div>

          {/* About */}
          <div className="text-xs text-[#8696A0] pt-2 border-t border-[#E9EDEF]">
            <p>
              Your profile information is visible to contacts and other users in chats.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
