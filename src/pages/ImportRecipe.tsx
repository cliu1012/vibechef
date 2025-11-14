import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { toast } from "sonner";

interface ImportedRecipe {
  id: string;
  title: string;
  source_url: string;
}

const ImportRecipe = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ImportedRecipe | null>(null);

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("You must be logged in to import recipes");
        return;
      }

      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke(
        'import-myplate-recipe',
        {
          body: { url },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess(data.recipe);
      toast.success(`Successfully imported: ${data.recipe.title}`);
      setUrl("");
      
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import recipe. Please try again.");
      toast.error("Failed to import recipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-2xl">Import Recipe from MyPlate</CardTitle>
            <CardDescription>
              Paste a MyPlate recipe URL to import it into VibeChef's database.
              Example: https://www.myplate.gov/recipes/2-step-chicken
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://www.myplate.gov/recipes/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleImport} 
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import"
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-success">
                    Successfully imported: <strong>{success.title}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(success.source_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Original
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Go to <a href="https://www.myplate.gov/recipes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myplate.gov/recipes</a></li>
                <li>Find a recipe you want to import</li>
                <li>Copy the full URL from your browser</li>
                <li>Paste it in the field above and click Import</li>
                <li>The recipe will be parsed and added to your database</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportRecipe;
