import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, Phone, Globe, MapPin, User, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BusinessProfile {
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
  primaryServices: string[];
  targetClients: string[];
  businessGoals: string[];
}

export default function BusinessProfile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mock current profile data - in a real app this would come from the user's actual business data
  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: "My Business",
    businessType: "Consulting",
    email: "contact@mybusiness.com",
    phone: "(555) 123-4567",
    website: "www.mybusiness.com",
    address: "123 Business St, City, State 12345",
    description: "Professional consulting services focused on productivity and accountability.",
    primaryServices: ["Business Consulting", "Productivity Coaching"],
    targetClients: ["Small Businesses", "Entrepreneurs"],
    businessGoals: ["Increase Productivity", "Better Time Management"]
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your business profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BusinessProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Business Profile</h1>
            <p className="text-muted-foreground">Manage your business information and settings</p>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Core business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                {isEditing ? (
                  <Input
                    id="businessName"
                    value={profile.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground font-medium">{profile.businessName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                {isEditing ? (
                  <Input
                    id="businessType"
                    value={profile.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground">{profile.businessType}</p>
                )}
              </div>

              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={profile.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                ) : (
                  <p className="text-foreground">{profile.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Contact Information</span>
              </CardTitle>
              <CardDescription>
                How clients and partners can reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{profile.email}</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{profile.phone}</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{profile.website}</span>
                )}
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                {isEditing ? (
                  <Textarea
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                ) : (
                  <span className="text-foreground">{profile.address}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services & Specialties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5" />
                <span>Services & Specialties</span>
              </CardTitle>
              <CardDescription>
                What you offer and who you serve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Services</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.primaryServices.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Target Clients</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.targetClients.map((client, index) => (
                    <Badge key={index} variant="outline">
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Business Goals</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.businessGoals.map((goal, index) => (
                    <Badge key={index} variant="default">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productivity Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Productivity Overview</CardTitle>
              <CardDescription>
                Your current system performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Profile Completion</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Accountability Score</span>
                <Badge variant="secondary">Getting Started</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Complete these items to maximize your productivity system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Verify all contact information is accurate</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Complete evidence collection training task</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Business profile accessed - good start!</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}