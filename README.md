# Kit & Jess's Meal Planner

A collaborative meal planning application built with React and Supabase. Plan your weekly meals, manage recipes, and generate shopping lists automatically.

## Features

- 📅 **Weekly Calendar View** - Plan lunch and dinner for the week
- 📖 **Recipe Management** - Store and organize your favorite recipes
- 🛒 **Smart Shopping Lists** - Automatically generated from your meal plan
- 👥 **Multi-User Support** - Share meal plans with family members
- 🔄 **Real-time Sync** - Changes sync instantly across devices
- 🎨 **Modern UI** - Clean, intuitive interface with earthy color palette

## Tech Stack

- **Frontend**: React 18, React Router v6
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Hosting**: Render (Static Site)
- **Styling**: Custom CSS with CSS variables

## Local Development

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/meal-planner.git
   cd meal-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Follow the instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) to create the database tables.

5. **Start the development server**
   ```bash
   npm start
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Deployment to Render

### Prerequisites

- GitHub account
- Render account (free tier)
- Supabase project set up

### Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create a new Static Site on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Select the `meal-planner` repository

3. **Configure build settings**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

4. **Add environment variables**
   
   In the Render dashboard, go to "Environment" and add:
   - `REACT_APP_SUPABASE_URL` = your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key

5. **Deploy**
   - Click "Create Static Site"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-app-name.onrender.com`

### Automatic Deployments

Render automatically deploys when you push to the `main` branch:
```bash
git add .
git commit -m "Add new feature"
git push origin main
# Render will automatically rebuild and deploy
```

## Project Structure

```
meal-planner/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── Calendar.js
│   │   ├── RecipeMenu.js
│   │   ├── ShoppingBasket.js
│   │   └── Navigation.js
│   ├── styles/          # CSS files
│   ├── utils/           # Utility functions
│   │   └── supabaseClient.js
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
├── .env.local           # Environment variables (not in git)
├── .gitignore
├── package.json
└── README.md
```

## Database Schema

See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for detailed database schema and setup instructions.

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (one-way operation)

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGc...` |

## Contributing

This is a personal project for Kit & Jess. If you'd like to use it for your own meal planning:

1. Fork the repository
2. Set up your own Supabase project
3. Deploy to your own Render account

## License

MIT License - feel free to use this for your own meal planning!

## Support

For issues or questions, please open an issue on GitHub.

## Roadmap

Future features planned:
- [ ] Recipe search function
- [ ] Google Calendar integration
- [ ] AI-powered recipe import from URLs
- [ ] User authentication
- [ ] Mobile app (React Native)
- [ ] Recipe sharing with friends
- [ ] Nutritional information
- [ ] Meal prep mode

---

Built with ❤️ by Kit for Kit & Jess