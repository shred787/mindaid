import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Camera, FileText, Link, CheckCircle } from "lucide-react";
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
    type: 'photo' | 'document' | 'link' | 'note';
    content: string;
    name?: string;
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
  const [newNote, setNewNote] = useState("");

  const addAttachment = (type: TaskEvidence['attachments'][0]['type'], content: string, name?: string) => {
    setAttachments(prev => [...prev, { type, content, name }]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        addAttachment(
          file.type.startsWith('image/') ? 'photo' : 'document',
          content,
          file.name
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!description.trim() && attachments.length === 0) {
      return; // Require at least description or attachments
    }

    onSubmit({
      description: description.trim(),
      attachments
    });

    // Reset form
    setDescription("");
    setAttachments([]);
    setNewLink("");
    setNewNote("");
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Task Completion Evidence
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            You've marked "{taskTitle}" as complete. Please provide evidence of completion.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Completion Summary *</Label>
            <Textarea
              id="description"
              placeholder="Describe what you accomplished and how the task was completed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Evidence Collection Options */}
          <div className="space-y-4">
            <Label>Evidence Attachments</Label>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Photo Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Camera className="h-6 w-6 mb-1" />
                  Photo Evidence
                </Button>
              </div>

              {/* Document Upload */}
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full h-20 flex-col">
                  <FileText className="h-6 w-6 mb-1" />
                  Document
                </Button>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a relevant link (website, shared document, etc.)"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (newLink.trim()) {
                      addAttachment('link', newLink.trim());
                      setNewLink("");
                    }
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a quick note or observation"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (newNote.trim()) {
                      addAttachment('note', newNote.trim());
                      setNewNote("");
                    }
                  }}
                >
                  <Upload className="h-4 w-4" />
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
                      {attachment.type === 'photo' && <Camera className="h-4 w-4" />}
                      {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                      {attachment.type === 'link' && <Link className="h-4 w-4" />}
                      {attachment.type === 'note' && <Upload className="h-4 w-4" />}
                      <span className="text-sm">
                        {attachment.name || 
                         (attachment.type === 'link' ? attachment.content.substring(0, 30) + '...' : 
                          attachment.type === 'note' ? attachment.content.substring(0, 30) + '...' : 
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
              className="flex-1"
            >
              Submit Evidence & Complete Task
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}