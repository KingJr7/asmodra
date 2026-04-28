<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>FlyerAI - Créez des flyers pros en un clic</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        "colors": {
                "error": "#ffb4ab",
                "on-primary-container": "#ede0ff",
                "surface-container-low": "#1d1a24",
                "surface": "#15121b",
                "outline-variant": "#4a4455",
                "on-primary-fixed": "#25005a",
                "on-tertiary-fixed": "#001e2c",
                "outline": "#958da1",
                "on-tertiary-container": "#caeaff",
                "surface-tint": "#d2bbff",
                "on-secondary": "#283044",
                "inverse-on-surface": "#332f39",
                "tertiary-fixed": "#c4e7ff",
                "inverse-surface": "#e8dfee",
                "on-secondary-fixed-variant": "#3f465c",
                "on-background": "#e8dfee",
                "tertiary": "#7bd0ff",
                "on-surface": "#e8dfee",
                "primary": "#d2bbff",
                "on-primary": "#3f008e",
                "on-error-container": "#ffdad6",
                "on-primary-fixed-variant": "#5a00c6",
                "primary-fixed-dim": "#d2bbff",
                "on-secondary-container": "#adb4ce",
                "on-tertiary": "#00354a",
                "on-error": "#690005",
                "tertiary-container": "#006e95",
                "secondary-fixed-dim": "#bec6e0",
                "surface-variant": "#37333e",
                "secondary": "#bec6e0",
                "on-secondary-fixed": "#131b2e",
                "surface-container-high": "#2c2833",
                "primary-container": "#7c3aed",
                "surface-container-lowest": "#100d16",
                "on-tertiary-fixed-variant": "#004c69",
                "surface-container-highest": "#37333e",
                "surface-dim": "#15121b",
                "surface-bright": "#3c3742",
                "error-container": "#93000a",
                "inverse-primary": "#732ee4",
                "background": "#15121b",
                "surface-container": "#221e28",
                "on-surface-variant": "#ccc3d8",
                "secondary-fixed": "#dae2fd",
                "tertiary-fixed-dim": "#7bd0ff",
                "primary-fixed": "#eaddff",
                "secondary-container": "#3f465c"
        },
        "borderRadius": {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
        },
        "spacing": {
                "sm": "12px",
                "margin": "32px",
                "md": "24px",
                "xl": "80px",
                "xs": "4px",
                "lg": "48px",
                "base": "8px",
                "gutter": "24px"
        },
        "fontFamily": {
                "display-lg": [
                        "Space Grotesk"
                ],
                "headline-md": [
                        "Space Grotesk"
                ],
                "headline-sm": [
                        "Space Grotesk"
                ],
                "body-lg": [
                        "Inter"
                ],
                "label-sm": [
                        "Inter"
                ],
                "body-md": [
                        "Inter"
                ]
        },
        "fontSize": {
                "display-lg": [
                        "48px",
                        {
                                "lineHeight": "1.1",
                                "letterSpacing": "-0.02em",
                                "fontWeight": "700"
                        }
                ],
                "headline-md": [
                        "32px",
                        {
                                "lineHeight": "1.2",
                                "letterSpacing": "-0.01em",
                                "fontWeight": "600"
                        }
                ],
                "headline-sm": [
                        "24px",
                        {
                                "lineHeight": "1.3",
                                "fontWeight": "500"
                        }
                ],
                "body-lg": [
                        "18px",
                        {
                                "lineHeight": "1.6",
                                "fontWeight": "400"
                        }
                ],
                "label-sm": [
                        "12px",
                        {
                                "lineHeight": "1.0",
                                "letterSpacing": "0.05em",
                                "fontWeight": "600"
                        }
                ],
                "body-md": [
                        "16px",
                        {
                                "lineHeight": "1.5",
                                "fontWeight": "400"
                        }
                ]
        }
},
    },
  }
</script>
<style>
  .glass-edge {
    box-shadow: inset 1px 1px 0px 0px rgba(255, 255, 255, 0.05);
  }
</style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md text-body-md antialiased overflow-x-hidden selection:bg-primary/30 selection:text-primary">
<!-- TopAppBar from JSON -->
<header class="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-lg shadow-[0_8px_32px_rgba(124,58,237,0.1)]">
<div class="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
<div class="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-space-grotesk tracking-tight">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
<span class="text-2xl font-black text-white">FlyerAI</span>
</div>
<button class="text-emerald-400 font-bold hover:text-emerald-400 hover:bg-white/5 transition-all duration-300 active:scale-95 px-4 py-2 rounded-full border border-emerald-400/30">
        Try for free
      </button>
</div>
</header>
<main class="pt-[100px] pb-xl px-margin max-w-7xl mx-auto flex flex-col gap-[120px]">
<!-- Hero Section -->
<section class="flex flex-col items-center text-center gap-md relative mt-xl">
<!-- Ambient Glow -->
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
<div class="z-10 inline-flex items-center gap-2 bg-surface-container-high/80 backdrop-blur-md border border-outline/20 px-sm py-xs rounded-full mb-sm glass-edge">
<span class="material-symbols-outlined text-primary text-[16px]">stars</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Lancement Officiel</span>
</div>
<h1 class="font-display-lg text-display-lg text-on-background max-w-4xl z-10 leading-tight">
        Créez des flyers pros en un clic avec l'IA
      </h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl z-10">
        Générez des designs époustouflants instantanément. Sans compétences graphiques.
      </p>
<button class="z-10 mt-md bg-primary text-on-primary px-[32px] py-[16px] rounded-full font-label-sm text-[16px] font-bold hover:opacity-90 transition-opacity shadow-[0_0_24px_rgba(210,187,255,0.4)]">
        Commencer gratuitement
      </button>
</section>
<!-- Visual Demo Section -->
<section class="flex justify-center z-10 w-full">
<div class="w-full max-w-[340px] aspect-[9/19] rounded-[2rem] border-[4px] border-surface-container-high bg-surface-container-low relative overflow-hidden shadow-[0_20px_60px_rgba(124,58,237,0.15)] flex flex-col">
<!-- Phone Top Notch -->
<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[24px] bg-surface-container-high rounded-b-xl z-20"></div>
<!-- App Content -->
<div class="flex-1 w-full bg-surface relative overflow-hidden flex flex-col justify-end p-sm" data-alt="vibrant abstract neon glow background with dark purple and bright cyan colors, futuristic club flyer aesthetic" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDt8m6GADurhF1wBOJAh5w5mrYDgu507fmlNVZa9YCoFbZX0clgEulnTBvuaC3oEMeMID7sC_M6BqIlM-saISVJCymlcvgvCJqBsgGtrEgWB4vPDjQYy56FYLEwWIUjbSizdXDzxT0SB3FEFGWU0SmtIOeOn0cCQAsBOsS_rzZBXi0jCnqltn5vl2vPWl1h4zOjZAnUnEZluTpRckB_GGhu5LkEjivBCo_e169sqq_EMSaD5OLHDaD8LvVf3GXQ77wi8L-76HD3L8xV'); background-size: cover; background-position: center;">
<!-- Glass Overlay for UI -->
<div class="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-0"></div>
<!-- Mock UI Elements -->
<div class="z-10 bg-surface-container/70 backdrop-blur-md border border-outline/20 rounded-xl p-md glass-edge flex flex-col gap-sm">
<div class="flex items-center justify-between">
<span class="font-label-sm text-label-sm text-on-surface">Génération en cours...</span>
<span class="material-symbols-outlined text-primary animate-spin">cycle</span>
</div>
<!-- Progress Bar -->
<div class="w-full h-[6px] bg-surface-variant rounded-full overflow-hidden">
<div class="h-full bg-gradient-to-r from-primary to-tertiary w-[75%] rounded-full"></div>
</div>
<div class="flex gap-xs flex-wrap mt-xs">
<span class="bg-primary/20 text-primary border border-primary/30 px-xs py-[2px] rounded font-label-sm text-[10px]">#Club</span>
<span class="bg-primary/20 text-primary border border-primary/30 px-xs py-[2px] rounded font-label-sm text-[10px]">#Néon</span>
<span class="bg-primary/20 text-primary border border-primary/30 px-xs py-[2px] rounded font-label-sm text-[10px]">#Minimal</span>
</div>
</div>
</div>
</div>
</section>
<!-- Features Section (Bento Grid Style) -->
<section class="flex flex-col gap-lg items-center">
<h2 class="font-headline-md text-headline-md text-on-background text-center max-w-xl">
        La puissance d'une agence, dans votre poche.
      </h2>
<div class="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
<!-- Feature 1 -->
<div class="bg-surface-container-low/80 backdrop-blur-lg border border-outline/10 rounded-xl p-lg flex flex-col gap-sm glass-edge relative overflow-hidden group">
<div class="absolute top-0 right-0 w-[150px] h-[150px] bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-colors"></div>
<div class="w-12 h-12 rounded-lg bg-surface-container-high border border-outline/20 flex items-center justify-center text-primary mb-xs">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bolt</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">Intelligence Artificielle</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Des résultats rapides et uniques pour chaque requête. L'IA analyse votre texte et compose une image parfaite.</p>
</div>
<!-- Feature 2 -->
<div class="bg-surface-container-low/80 backdrop-blur-lg border border-outline/10 rounded-xl p-lg flex flex-col gap-sm glass-edge relative overflow-hidden group">
<div class="absolute top-0 right-0 w-[150px] h-[150px] bg-tertiary/5 blur-[50px] rounded-full group-hover:bg-tertiary/10 transition-colors"></div>
<div class="w-12 h-12 rounded-lg bg-surface-container-high border border-outline/20 flex items-center justify-center text-tertiary mb-xs">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">tune</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">Personnalisation Totale</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Ajustez les couleurs, les polices et la disposition avec des contrôles intuitifs après la génération.</p>
</div>
<!-- Feature 3 -->
<div class="bg-surface-container-low/80 backdrop-blur-lg border border-outline/10 rounded-xl p-lg flex flex-col gap-sm glass-edge relative overflow-hidden group">
<div class="absolute top-0 right-0 w-[150px] h-[150px] bg-primary-fixed/5 blur-[50px] rounded-full group-hover:bg-primary-fixed/10 transition-colors"></div>
<div class="w-12 h-12 rounded-lg bg-surface-container-high border border-outline/20 flex items-center justify-center text-primary-fixed-dim mb-xs">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">high_quality</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">Haute Résolution</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Exportez vos créations en qualité d'impression (4K) ou optimisées pour tous les réseaux sociaux.</p>
</div>
</div>
</section>
<!-- Payments Banner -->
<section class="w-full bg-surface-container-low border border-outline/10 rounded-xl p-lg flex flex-col items-center text-center gap-md relative overflow-hidden glass-edge">
<div class="absolute -left-[100px] top-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-tertiary/10 blur-[80px] rounded-full pointer-events-none"></div>
<div class="absolute -right-[100px] top-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[#ffcc00]/10 blur-[80px] rounded-full pointer-events-none"></div>
<h2 class="font-headline-sm text-headline-sm text-on-background relative z-10">Payez en toute simplicité</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md relative z-10 mb-sm">
        Transactions sécurisées et adaptées à vos moyens de paiement locaux en FCFA.
      </p>
<div class="flex gap-md items-center justify-center flex-wrap relative z-10">
<!-- MTN Money Generic Representation -->
<div class="flex items-center gap-sm bg-surface border border-outline/20 px-md py-sm rounded-lg shadow-sm">
<div class="w-8 h-8 rounded-full bg-[#ffcc00] flex items-center justify-center text-black">
<span class="material-symbols-outlined text-[18px]">smartphone</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface">MTN Mobile Money</span>
</div>
<!-- Airtel Money Generic Representation -->
<div class="flex items-center gap-sm bg-surface border border-outline/20 px-md py-sm rounded-lg shadow-sm">
<div class="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center text-white">
<span class="material-symbols-outlined text-[18px]">payments</span>
</div>
<span class="font-label-sm text-label-sm text-on-surface">Airtel Money</span>
</div>
</div>
</section>
<!-- Pricing Section -->
<section class="flex flex-col gap-lg items-center w-full">
<div class="text-center flex flex-col gap-sm">
<h2 class="font-headline-md text-headline-md text-on-background">Des tarifs clairs et transparents</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Choisissez le plan qui correspond à votre ambition.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-md w-full max-w-5xl">
<!-- Free Tier -->
<div class="bg-surface-container-low border border-outline/10 rounded-xl p-lg flex flex-col gap-md glass-edge">
<div class="flex flex-col gap-xs">
<h3 class="font-headline-sm text-headline-sm text-on-surface">Gratuit</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Pour tester la magie de l'IA.</p>
</div>
<div class="font-display-lg text-display-lg text-on-background my-sm">
            0 <span class="font-headline-sm text-headline-sm text-on-surface-variant">FCFA</span>
</div>
<ul class="flex flex-col gap-sm flex-1">
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-outline">check_circle</span> 5 flyers par mois
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-outline">check_circle</span> Qualité standard
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface-variant opacity-50">
<span class="material-symbols-outlined text-outline">cancel</span> Filigrane FlyerAI
            </li>
</ul>
<button class="w-full py-sm rounded-lg border border-outline text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors mt-md">
            Commencer
          </button>
</div>
<!-- Pro Tier (Most Popular) -->
<div class="bg-surface-container border border-primary relative rounded-xl p-lg flex flex-col gap-md shadow-[0_0_40px_rgba(210,187,255,0.15)] transform md:-translate-y-4">
<div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary px-sm py-[4px] rounded-full font-label-sm text-[11px] font-bold uppercase tracking-wide">
            Le plus populaire
          </div>
<div class="flex flex-col gap-xs">
<h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              Pro <span class="material-symbols-outlined text-primary text-[20px]" style="font-variation-settings: 'FILL' 1;">stars</span>
</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Pour les freelances et PME.</p>
</div>
<div class="font-display-lg text-display-lg text-on-background my-sm text-primary">
            5000 <span class="font-headline-sm text-headline-sm text-primary/70">FCFA<span class="text-[16px] font-normal">/mois</span></span>
</div>
<ul class="flex flex-col gap-sm flex-1">
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-primary">check_circle</span> Flyers illimités
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-primary">check_circle</span> Export Haute Résolution (4K)
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-primary">check_circle</span> Aucun filigrane
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-primary">check_circle</span> Support prioritaire
            </li>
</ul>
<button class="w-full py-sm rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold hover:bg-primary-fixed transition-colors mt-md shadow-[0_4px_14px_rgba(210,187,255,0.4)]">
            S'abonner maintenant
          </button>
</div>
<!-- Enterprise Tier -->
<div class="bg-surface-container-low border border-outline/10 rounded-xl p-lg flex flex-col gap-md glass-edge">
<div class="flex flex-col gap-xs">
<h3 class="font-headline-sm text-headline-sm text-on-surface">Enterprise</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Pour les agences et grandes équipes.</p>
</div>
<div class="font-display-lg text-display-lg text-on-background my-sm">
            Sur devis
          </div>
<ul class="flex flex-col gap-sm flex-1">
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-outline">check_circle</span> Tout de l'offre Pro
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-outline">check_circle</span> Accès API
            </li>
<li class="flex items-center gap-sm font-body-md text-body-md text-on-surface">
<span class="material-symbols-outlined text-outline">check_circle</span> Modèles IA personnalisés
            </li>
</ul>
<button class="w-full py-sm rounded-lg border border-outline text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors mt-md">
            Contacter l'équipe
          </button>
</div>
</div>
</section>
<!-- Final CTA -->
<section class="w-full bg-gradient-to-br from-surface-container-high to-surface-container border border-outline/20 rounded-2xl p-xl flex flex-col items-center text-center gap-md relative overflow-hidden glass-edge shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
<div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&amp;w=2000&amp;auto=format&amp;fit=crop')] opacity-10 mix-blend-overlay bg-cover bg-center" data-alt="abstract liquid flowing shapes in deep purple and dark tones, subtle background texture"></div>
<h2 class="font-headline-md text-headline-md text-on-background max-w-2xl relative z-10">
        Prêt à révolutionner vos designs ?
      </h2>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl relative z-10">
        Rejoignez des milliers de professionnels qui gagnent du temps chaque jour.
      </p>
<button class="relative z-10 mt-sm bg-primary text-on-primary px-[40px] py-[16px] rounded-full font-label-sm text-[16px] font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(210,187,255,0.3)]">
        Créer mon premier flyer
      </button>
</section>
</main>
<!-- Footer from JSON -->
<footer class="w-full py-12 border-t border-white/5 bg-slate-950 mt-xl">
<div class="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
<div class="flex flex-col gap-2">
<span class="text-xl font-bold text-white">FlyerAI</span>
<span class="text-slate-500 font-space-grotesk text-sm tracking-wide">© 2024 FlyerAI. Powered by Creative Intelligence.</span>
</div>
<nav class="flex gap-6">
<a class="text-slate-500 font-space-grotesk text-sm tracking-wide hover:text-violet-400 transition-colors" href="#">Features</a>
<a class="text-slate-500 font-space-grotesk text-sm tracking-wide hover:text-violet-400 transition-colors" href="#">Pricing</a>
<a class="text-slate-500 font-space-grotesk text-sm tracking-wide hover:text-violet-400 transition-colors" href="#">Showcase</a>
<a class="text-slate-500 font-space-grotesk text-sm tracking-wide hover:text-violet-400 transition-colors" href="#">Privacy Policy</a>
</nav>
</div>
</footer>
</body></html>
