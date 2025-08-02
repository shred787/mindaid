import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Globe, MapPin, Camera, Edit3, Save, X, Briefcase, Target, Clock, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface UserProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  timezone: string;
  profileImage: string;
  
  // Professional Information
  jobTitle: string;
  company: string;
  industry: string;
  experience: string;
  skills: string[];
  
  // Productivity Preferences
  workingHours: {
    start: string;
    end: string;
  };
  productivityGoals: string[];
  accountabilityLevel: 'light' | 'moderate' | 'strict';
  preferredMethods: string[];
  
  // Social Information
  linkedin: string;
  website: string;
  bio: string;
  
  // System Stats
  joinDate: string;
  tasksCompleted: number;
  evidenceSubmitted: number;
  accountabilityScore: number;
}

export default function UserProfile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  
  // Mock profile data - in real app would come from user data + onboarding responses
  const [profile, setProfile] = useState<UserProfile>({
    // Personal Information
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex.johnson@email.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    timezone: "Pacific Time",
    profileImage: "", // Would be actual image URL
    
    // Professional Information
    jobTitle: "Senior Consultant",
    company: "Strategic Solutions Inc",
    industry: "Business Consulting",
    experience: "5+ years",
    skills: ["Strategic Planning", "Project Management", "Client Relations", "Data Analysis"],
    
    // Productivity Preferences
    workingHours: {
      start: "09:00",
      end: "17:00"
    },
    productivityGoals: ["Increase Productivity", "Better Time Management", "Stronger Accountability"],
    accountabilityLevel: 'strict',
    preferredMethods: ["Evidence Screenshots", "Document Uploads", "Time Tracking"],
    
    // Social Information
    linkedin: "linkedin.com/in/alexjohnson",
    website: "www.alexjohnson.consulting",
    bio: "Results-driven consultant focused on operational excellence and accountability-driven productivity systems.",
    
    // System Stats
    joinDate: "2025-01-15",
    tasksCompleted: 12,
    evidenceSubmitted: 8,
    accountabilityScore: 85
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In real app, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
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

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  };

  const getAccountabilityColor = () => {
    if (profile.accountabilityScore >= 80) return "text-green-600";
    if (profile.accountabilityScore >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Profile</h1>
              <p className="text-muted-foreground">Manage your personal and professional information</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.profileImage} />
                  <AvatarFallback className="text-2xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <Badge 
                    variant={profile.accountabilityLevel === 'strict' ? 'destructive' : 
                             profile.accountabilityLevel === 'moderate' ? 'default' : 'secondary'}
                  >
                    {profile.accountabilityLevel === 'strict' ? 'Maximum Accountability' : 
                     profile.accountabilityLevel === 'moderate' ? 'Balanced' : 'Gentle'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">{profile.jobTitle} at {profile.company}</p>
                <p className="text-sm mb-4">{profile.bio}</p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile.tasksCompleted}</div>
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{profile.evidenceSubmitted}</div>
                    <div className="text-xs text-muted-foreground">Evidence Submitted</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold text-lg ${getAccountabilityColor()}`}>
                      {profile.accountabilityScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Accountability Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{Math.floor((new Date().getTime() - new Date(profile.joinDate).getTime()) / (1000 * 60 * 60 * 24))}</div>
                    <div className="text-xs text-muted-foreground">Days Active</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>Basic personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground font-medium">{profile.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground font-medium">{profile.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        value={profile.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="flex-1"
                        placeholder="City, State/Country"
                      />
                    ) : (
                      <span className="text-foreground">{profile.location}</span>
                    )}
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    {isEditing ? (
                      <Input
                        value={profile.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground">{profile.timezone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Information Tab */}
          <TabsContent value="professional" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Professional Details</span>
                </CardTitle>
                <CardDescription>Career and professional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title</Label>
                    {isEditing ? (
                      <Input
                        value={profile.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground font-medium">{profile.jobTitle}</p>
                    )}
                  </div>
                  <div>
                    <Label>Company</Label>
                    {isEditing ? (
                      <Input
                        value={profile.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground font-medium">{profile.company}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Industry</Label>
                    {isEditing ? (
                      <Input
                        value={profile.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground">{profile.industry}</p>
                    )}
                  </div>
                  <div>
                    <Label>Experience Level</Label>
                    {isEditing ? (
                      <Input
                        value={profile.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground">{profile.experience}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Skills & Expertise</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Productivity Settings Tab */}
          <TabsContent value="productivity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Productivity Preferences</span>
                </CardTitle>
                <CardDescription>Your productivity goals and accountability settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Working Hours</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      {isEditing ? (
                        <Input
                          type="time"
                          value={profile.workingHours.start}
                          onChange={(e) => handleInputChange('workingHours', {
                            ...profile.workingHours,
                            start: e.target.value
                          })}
                        />
                      ) : (
                        <p className="text-foreground">{profile.workingHours.start}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      {isEditing ? (
                        <Input
                          type="time"
                          value={profile.workingHours.end}
                          onChange={(e) => handleInputChange('workingHours', {
                            ...profile.workingHours,
                            end: e.target.value
                          })}
                        />
                      ) : (
                        <p className="text-foreground">{profile.workingHours.end}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Productivity Goals</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.productivityGoals.map((goal, index) => (
                      <Badge key={index} variant="default">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Accountability Level</Label>
                  <div className="mt-2">
                    <Badge 
                      variant={profile.accountabilityLevel === 'strict' ? 'destructive' : 
                               profile.accountabilityLevel === 'moderate' ? 'default' : 'secondary'}
                      className="text-sm"
                    >
                      {profile.accountabilityLevel === 'strict' ? 'Maximum Accountability - Zero tolerance for excuses' : 
                       profile.accountabilityLevel === 'moderate' ? 'Balanced - Professional accountability' : 
                       'Gentle - Supportive encouragement'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Preferred Evidence Methods</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.preferredMethods.map((method, index) => (
                      <Badge key={index} variant="outline">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Information Tab */}
          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Social & Professional Links</span>
                </CardTitle>
                <CardDescription>Your online presence and professional networks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label>Website</Label>
                      {isEditing ? (
                        <Input
                          value={profile.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="www.yourwebsite.com"
                        />
                      ) : (
                        <p className="text-foreground">{profile.website}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label>LinkedIn</Label>
                      {isEditing ? (
                        <Input
                          value={profile.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          placeholder="linkedin.com/in/yourprofile"
                        />
                      ) : (
                        <p className="text-foreground">{profile.linkedin}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Professional Bio</Label>
                  {isEditing ? (
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      placeholder="Write a brief professional bio..."
                    />
                  ) : (
                    <p className="text-foreground mt-2">{profile.bio}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}