import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Camera, FileText, Link, CheckCircle, Mail, Phone, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EvidenceCollectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (evidence: TaskEvidence) => void;
  taskTitle: string;
}

export interface TaskEvidence {
  description: string;
  attachments: Array<{
    type: 'screenshot' | 'document' | 'email' | 'call_log' | 'file' | 'link';
    content: string;
    name?: string;
    fileType?: string;
  }>;
}

export function EvidenceCollectionDialog({
  open,
  onClose,
  onSubmit,
  taskTitle
}: EvidenceCollectionDialogProps) {
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<TaskEvidence['attachments']>([]);
  const [newLink, setNewLink] = useState("");
  const [validationError, setValidationError] = useState("");

  const addAttachment = (type: TaskEvidence['attachments'][0]['type'], content: string, name?: string, fileType?: string) => {
    setAttachments(prev => [...prev, { type, content, name, fileType }]);
  };

  const validateEvidence = (): boolean => {
    setValidationError("");
    
    // Dan Pena-style accountability validation - reject BS responses
    const bsPatterns = [
      "i did that", "but i did that", "completed", "done", "finished", 
      "i finished", "i completed", "task done", "work done", "all done",
      "its done", "it's done", "i did it", "did it", "already did",
      "worked on it", "made progress", "almost done", "nearly finished"
    ];
    
    if (description.trim().length < 15) {
      setValidationError("INSUFFICIENT DETAIL - This brief response shows lack of accountability. Success requires precision - provide substantial evidence of what was accomplished.");
      return false;
    }
    
    const descLower = description.toLowerCase();
    if (bsPatterns.some(phrase => descLower.includes(phrase))) {
      setValidationError("REJECTED - This generic response is exactly what leads to failure. I need SPECIFIC deliverables: What files did you create? What problems did you solve? What measurable outcome was achieved?");
      return false;
    }
    
    // Demand either attachments OR substantial description (75+ chars)
    if (attachments.length === 0 && description.trim().length < 75) {
      setValidationError("INADEQUATE PROOF - Either provide screenshots/documents OR detailed evidence (75+ characters). Accountability means showing tangible results - what specific deliverable can you prove was completed?");
      return false;
    }
    
    return true;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, evidenceType: 'screenshot' | 'document' | 'email' | 'call_log' | 'file') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        addAttachment(
          evidenceType,
          content,
          file.name,
          file.type
        );
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    event.target.value = '';
  };

  const handleSubmit = () => {
    if (!validateEvidence()) {
      return;
    }

    onSubmit({
      description: description.trim(),
      attachments
    });

    // Reset form
    setDescription("");
    setAttachments([]);
    setNewLink("");
    setValidationError("");
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-red-600" />
            ACCOUNTABILITY CHECK - Evidence Required
          </DialogTitle>
          <p className="text-sm text-red-700 font-medium">
            "{taskTitle}" - No generic "I finished it" claims allowed. Show me SPECIFIC proof of what was delivered. Results matter, excuses don't.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Completion Summary *</Label>
            <Textarea
              id="description"
              placeholder="SPECIFICS ONLY: What EXACTLY was delivered? What measurable outcomes were achieved? Include names, numbers, files created, problems solved, specific actions taken, concrete results. No fluff, no generalities."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-red-600 font-medium">
              ZERO TOLERANCE for vague responses like "I did that" or "completed". Provide measurable outcomes and specific deliverables only.
            </p>
          </div>

          {/* Evidence Collection Options */}
          <div className="space-y-4">
            <div>
              <Label>Evidence Attachments (MANDATORY for accountability)</Label>
              <p className="text-xs text-red-600 font-medium mt-1">
                Show tangible proof: screenshots, documents, emails, call logs, or files that demonstrate MEASURABLE results
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Screenshot Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'screenshot')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Camera className="h-5 w-5 mb-1" />
                  <span className="text-xs">Screenshot</span>
                </Button>
              </div>

              {/* Document Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, 'document')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <FileText className="h-5 w-5 mb-1" />
                  <span className="text-xs">Document</span>
                </Button>
              </div>

              {/* Email Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept=".eml,.msg,.pdf,.txt"
                  onChange={(e) => handleFileUpload(e, 'email')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Mail className="h-5 w-5 mb-1" />
                  <span className="text-xs">Email</span>
                </Button>
              </div>

              {/* Call Log Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt,.csv,.xlsx"
                  onChange={(e) => handleFileUpload(e, 'call_log')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Phone className="h-5 w-5 mb-1" />
                  <span className="text-xs">Call Log</span>
                </Button>
              </div>

              {/* Any File Upload */}
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'file')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Upload className="h-5 w-5 mb-1" />
                  <span className="text-xs">Any File</span>
                </Button>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <Label className="text-sm">Reference Links</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add link to completed work, shared documents, live results, etc."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (newLink.trim() && newLink.includes('.')) {
                      addAttachment('link', newLink.trim());
                      setNewLink("");
                    }
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Current Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attached Evidence</Label>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      {attachment.type === 'screenshot' && <Camera className="h-4 w-4" />}
                      {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                      {attachment.type === 'email' && <Mail className="h-4 w-4" />}
                      {attachment.type === 'call_log' && <Phone className="h-4 w-4" />}
                      {attachment.type === 'file' && <Upload className="h-4 w-4" />}
                      {attachment.type === 'link' && <Link className="h-4 w-4" />}
                      <span className="text-sm">
                        {attachment.name || 
                         (attachment.type === 'link' ? attachment.content.substring(0, 30) + '...' : 
                          attachment.type)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!description.trim() && attachments.length === 0}
              className="flex-1 btn-primary-visible"
            >
              Submit Evidence & Complete Task
            </Button>
            <Button className="btn-secondary-visible" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}