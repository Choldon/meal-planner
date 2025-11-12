# Supabase Edge Function Deployment Guide

## 🔧 Troubleshooting: Test Function

If you're getting 502 errors, deploy this test function first to diagnose the issue:

### Deploy Test Function
```bash
supabase functions deploy import-recipe-test
```

Or via Dashboard:
1. Go to Edge Functions → Create Function
2. Name: `import-recipe-test`
3. Copy code from `supabase/functions/import-recipe-test/index.ts`
4. Deploy

### Test It
Call it from your app or use curl:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/import-recipe-test \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.bbcgoodfood.com/recipes/spaghetti-carbonara"}'
```

### Check Logs
The test function will log detailed information about:
- ✅ Request parsing
- ✅ Environment variables (OPENAI_API_KEY)
- ✅ Webpage fetching
- ✅ OpenAI API connectivity

This will show exactly where the issue is!

---


## 📋 Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **OpenAI API Key added to Supabase Secrets**
   - Already completed ✅

3. **Supabase Project linked**
   ```bash
   supabase link --project-ref your-project-ref
   ```

## 🚀 Deployment Steps

### Step 1: Navigate to Project Directory
```bash
cd /Users/kit/Desktop/meal-planner
```

### Step 2: Deploy the Edge Function
```bash
supabase functions deploy import-recipe
```

This will:
- Upload the function code to Supabase
- Make it available at: `https://your-project.supabase.co/functions/v1/import-recipe`
- Automatically use the `OPENAI_API_KEY` secret you configured

### Step 3: Verify Deployment
```bash
supabase functions list
```

You should see `import-recipe` in the list with status "deployed".

### Step 4: Test the Function (Optional)
```bash
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/import-recipe' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://www.bbcgoodfood.com/recipes/spaghetti-carbonara"}'
```

Replace:
- `your-project` with your Supabase project reference
- `YOUR_SUPABASE_ANON_KEY` with your anon key from Supabase dashboard

## 🔧 Troubleshooting

### Error: "Supabase CLI not found"
**Solution**: Install Supabase CLI
```bash
npm install -g supabase
```

### Error: "Project not linked"
**Solution**: Link your project
```bash
supabase link --project-ref your-project-ref
```

Find your project ref in Supabase Dashboard → Settings → General

### Error: "OPENAI_API_KEY not found"
**Solution**: Add the secret
```bash
supabase secrets set OPENAI_API_KEY=your-openai-key-here
```

Or via Dashboard:
1. Go to Edge Functions → Secrets
2. Add `OPENAI_API_KEY` with your key

### Error: "Function deployment failed"
**Solution**: Check function logs
```bash
supabase functions logs import-recipe
```

## 📊 Monitoring

### View Function Logs
```bash
supabase functions logs import-recipe --follow
```

### Check Function Status
```bash
supabase functions list
```

### View Recent Invocations
Go to Supabase Dashboard → Edge Functions → import-recipe → Logs

## 🔄 Updating the Function

After making changes to `supabase/functions/import-recipe/index.ts`:

```bash
supabase functions deploy import-recipe
```

The function will be updated immediately.

## 🔐 Security Notes

- The `OPENAI_API_KEY` is stored securely in Supabase
- Never commit API keys to Git
- The function uses CORS headers to allow requests from your frontend
- All requests are authenticated with Supabase auth

## 💰 Cost Monitoring

### OpenAI Costs
- Monitor at: https://platform.openai.com/usage
- Set spending limits in OpenAI dashboard
- Each import costs ~$0.001

### Supabase Costs
- Edge Functions: Free tier includes 500K invocations/month
- After free tier: $0.50 per 1M invocations
- Your usage: ~50 imports/month = negligible cost

## 📝 Function Configuration

The function is configured with:
- **Runtime**: Deno
- **Memory**: 512MB (default)
- **Timeout**: 60 seconds (default)
- **Region**: Auto (closest to user)

## 🎯 Next Steps

After deployment:
1. Test the import feature in your app
2. Try importing from different recipe websites
3. Monitor costs in OpenAI dashboard
4. Check function logs for any errors

## 🆘 Getting Help

If you encounter issues:
1. Check function logs: `supabase functions logs import-recipe`
2. Verify secrets: `supabase secrets list`
3. Test with curl command above
4. Check Supabase Dashboard → Edge Functions

---

**Your Edge Function is now deployed and ready to use! 🎉**