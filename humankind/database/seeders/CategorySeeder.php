<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Services\EmbeddingService;
use Illuminate\Database\Seeder;

// Crée (ou met à jour) les catégories de HumanKind avec leur embedding.
// Lancer : php artisan db:seed --class=CategorySeeder   (le FastAPI doit tourner)
//
// L'embedding est calculé à partir du NOM + d'une DESCRIPTION : plus il y a de mots,
// mieux l'IA comprend le sens de la catégorie, et plus le classement des annonces est précis.
// Pour ajouter une catégorie : l'ajouter dans la liste ci-dessous et relancer le seeder.
class CategorySeeder extends Seeder
{
    // anciens noms (portugais) → nouveaux noms : on renomme sans changer l'id,
    // pour que les annonces déjà classées gardent leur catégorie
    private const RENOMMAGES = [
        'Idiomas' => 'Langues',
        'Culinaria' => 'Cuisine',
    ];

    // Descriptions en français + mots-clés en anglais et en portugais (EN / PT) :
    // le site est trilingue, une annonce écrite dans une autre langue doit aussi trouver sa catégorie.
    private const CATEGORIES = [
        'Langues' => 'apprendre ou pratiquer une langue étrangère, conversation en anglais, français, portugais, espagnol, cours de langue, échange linguistique. EN: language exchange, practice English, speaking lessons. PT: idiomas, aula de inglês, conversação',
        'Cuisine' => 'cuisine, recettes, pâtisserie, faire du pain, préparer un repas, repas partagé, gastronomie. EN: cooking, baking, recipes, meal. PT: culinária, cozinhar, receitas, bolo, pão',
        'Jardinage' => 'jardin, potager, plantes, fleurs, tonte de pelouse, taille de haie, arrosage, semis. EN: gardening, lawn mowing, plants, vegetable garden. PT: jardinagem, horta, plantas, cortar grama',
        'Bricolage' => 'bricolage, montage de meubles, petites réparations, perceuse, peinture des murs, travaux à la maison. EN: DIY, furniture assembly, repairs, handyman. PT: bricolagem, montar móveis, consertos, reparos',
        'Numérique' => 'informatique, apprendre à programmer, cours d\'informatique, programmation, développement logiciel, code, Java, Python, site web, ordinateur, smartphone, internet, téléphone portable. EN: computer, smartphone, phone, app, programming, coding, internet help. PT: informática, computador, celular, programação, internet',
        // "courses" = faire ses achats ; à ne pas confondre avec "cours" (leçons) : on précise "alimentaires", "supermarché"
        'Courses et accompagnement' => 'faire les courses alimentaires au supermarché, porter les sacs de provisions, accompagner une personne âgée au marché, chez le médecin ou à un rendez-vous. EN: grocery shopping, accompany an elderly person. PT: fazer compras no supermercado, acompanhar idoso',
        'Démarches et papiers' => 'aide administrative, remplir des papiers et des formulaires, déclaration d\'impôts, courrier, démarches en ligne, CAF, sécurité sociale, banque. EN: paperwork, tax return, forms, administration. PT: papelada, documentos, imposto de renda, formulários',
        'Animaux' => 'animaux de compagnie, promener un chien, garder un chat, nourrir les animaux pendant les vacances. EN: pets, dog walking, pet sitting, cat. PT: animais de estimação, passear com cachorro, cuidar de gato',
        'Bénévolat' => 'bénévolat, actions solidaires, ramasser des déchets, aider dans une association ou une maison de retraite. EN: volunteering, charity, community clean-up. PT: voluntariado, solidariedade, ação social',
        'Culture et histoire' => 'culture, histoire d\'un lieu ou d\'un quartier, patrimoine, musée, visite, lecture, littérature. EN: history, heritage, museum, guided tour, books. PT: cultura, história, museu, patrimônio, leitura',
        'Sport et plein air' => 'sport, balade, randonnée, marche, vélo, course à pied, pique-nique, parc, nature. EN: sport, hiking, walk, running, cycling, outdoors. PT: esporte, caminhada, trilha, corrida, bicicleta, parque',
        'Musique et arts' => 'musique, instrument, guitare, piano, chant, dessin, peinture, photographie, arts créatifs. EN: music, guitar, singing, drawing, painting, photography. PT: música, violão, canto, desenho, pintura, fotografia',
        // catégorie de secours : quand aucune autre n'est assez proche (voir EmbeddingService)
        EmbeddingService::CATEGORIE_PAR_DEFAUT => 'activité qui n\'entre dans aucune autre catégorie',
    ];

    public function run(EmbeddingService $embeddingService): void
    {
        foreach (self::RENOMMAGES as $ancien => $nouveau) {
            Category::where('name', $ancien)->update(['name' => $nouveau]);
        }

        foreach (self::CATEGORIES as $nom => $description) {
            $embedding = $embeddingService->generateEmbedding("{$nom} : {$description}");

            Category::updateOrCreate(['name' => $nom], ['embedding' => $embedding]);
            $this->command->info("Catégorie « {$nom} » prête");
        }
    }
}
