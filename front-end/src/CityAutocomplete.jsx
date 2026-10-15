import { useEffect, useState } from 'react';

const PHOTON_URL = 'https://photon.komoot.io/api/';

// Transforme un résultat Photon (GeoJSON) en objet simple
function toCity(feature) {
    const p = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    // Un quartier affiche aussi sa ville : "Centre-ville, Fontenay-le-Comte"
    const name = p.city && p.city !== p.name ? `${p.name}, ${p.city}` : p.name;
    const details = [p.postcode, p.country].filter(Boolean).join(' · ');

    return {
        id: `${p.osm_type}${p.osm_id}`,
        label: `${name}${p.country ? `, ${p.country}` : ''}`,
        name,
        details,
        lat,
        lon,
    };
}

// Champ "Ville ou quartier" : la personne doit choisir une ville réelle dans la liste.
// onSelect(city) est appelé avec la ville choisie, ou null si le texte ne correspond plus à un choix.
function CityAutocomplete({ id, selected, onSelect, invalid }) {
    const [query, setQuery] = useState(selected?.label ?? '');
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const search = query.trim();
    const shouldSearch = open && search.length >= 2 && search !== selected?.label;

    useEffect(() => {
        if (!shouldSearch) return;

        const controller = new AbortController();

        // debounce : on attend 300 ms sans frappe avant d'appeler l'API
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ q: search, limit: '5', lang: 'fr' });
                ['city', 'district', 'locality'].forEach((layer) => params.append('layer', layer));

                const response = await fetch(`${PHOTON_URL}?${params}`, { signal: controller.signal });
                const data = await response.json();
                // Photon renvoie parfois deux fois le même lieu (ville + quartier) : on garde un seul exemplaire
                const unique = new Map();
                data.features.map(toCity).forEach((city) => {
                    const key = `${city.name}|${city.details}`;
                    if (!unique.has(key)) unique.set(key, city);
                });
                setSuggestions([...unique.values()]);
            } catch (error) {
                if (error.name !== 'AbortError') setSuggestions([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 300);

        // si la personne tape encore : on annule le minuteur et la requête précédente
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, shouldSearch]);

    function handleChange(e) {
        setQuery(e.target.value);
        setOpen(true);
        if (selected) onSelect(null); // le texte a changé : la ville n'est plus validée
    }

    function handleSelect(city) {
        setQuery(city.label);
        setSuggestions([]);
        setOpen(false);
        onSelect(city);
    }

    const showList = shouldSearch && (loading || suggestions.length > 0);

    return (
        <div className='city-autocomplete'>
            <input
                id={id}
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder='Ex. : Fontenay-le-Comte'
                // Le navigateur ignore souvent autoComplete="off" sur un champ qui ressemble à une adresse.
                // Une valeur qu'il ne connaît pas + un "name" neutre + le rôle combobox l'empêchent
                // d'ouvrir son propre menu par-dessus nos suggestions.
                name='hk-place-search'
                autoComplete='hk-place-search'
                role='combobox'
                aria-autocomplete='list'
                aria-expanded={showList}
                aria-controls={`${id}-suggestions`}
                className={invalid ? 'is-invalid' : ''}
                aria-invalid={invalid}
            />

            {showList && (
                <ul className='city-suggestions' id={`${id}-suggestions`} role='listbox'>
                    {loading && suggestions.length === 0 && (
                        <li className='city-suggestions-info'>Recherche…</li>
                    )}
                    {suggestions.map((city) => (
                        <li key={city.id} role='option' aria-selected={false}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(city)}
                            >
                                <span className='city-name'>{city.name}</span>
                                <span className='city-details'>{city.details}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CityAutocomplete;
