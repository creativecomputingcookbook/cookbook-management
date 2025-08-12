// import { setCookie } from 'cookies-next';
import { Firestore } from '@google-cloud/firestore';
import CardList, { Card } from '../../components/CardList';

export default function Home() {

  const handleSubmit = async (formData: FormData) => {
    'use server';

    const db = new Firestore({
      projectId: 'cwp-11ty',
    });
    const pagesDb = db.collection('cwp-pages');

    // Extract form data
    const title = formData.get('title') as string;
    const tags = formData.get('tags') as string;
    const description = formData.get('description') as string;
    
    // Extract cards data
    const cards: Card[] = [];
    let index = 0;
    while (formData.get(`cards[${index}].id`)) {
      const card: Card = {
        id: formData.get(`cards[${index}].id`) as string,
        title: formData.get(`cards[${index}].title`) as string,
        description: formData.get(`cards[${index}].description`) as string,
      };
      cards.push(card);
      index++;
    }

    console.log('Form submitted with data:', { title, tags, description, cards });
    
    // Here you would save to your database
    // await pagesDb.add({ title, tags, description, cards });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a New Build
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" action={handleSubmit}>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            {/* <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                placeholder="Comma separated"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div> */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
            </div>
            
            <div>
              <CardList 
                name="cards"
                maxCards={5}
                className="mt-6"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}