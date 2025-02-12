"use client"
// import { scrapeAndStoreProduct } from '@/lib/actions';
import { FormEvent, useState } from 'react'

const isValidAmazonProductURL = (url:string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if(
      hostname.includes("amazon.com") || 
      hostname.includes("amazon.ca") || 
      hostname.includes("amazon.in") ||
      hostname.includes("amazon.de") ||
      hostname.includes("flipkart.com"))
    {
      return true;
    }
  } catch (error) {
    return false;
  } 

  return false;
}

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isValidLink = isValidAmazonProductURL(searchPrompt);

    if(!isValidLink) return alert("Please provide a valid amazon link");

    try {
      setIsLoading(true);
      // Scrape the product page
      // const product = await scrapeAndStoreProduct(searchPrompt);
    } catch (error) {
      console.log(error);
    } finally{
        setIsLoading(false);
    }
  }
    
  return (
    <form className='flex flew-wrap gap-4 mt-12' onSubmit={handleSubmit}>
        <input type="text" placeholder='Enter product link' 
        className='searchbar-input' onChange={(e) => setSearchPrompt(e.target.value)} />
        <button type='submit' className='searchbar-btn' disabled={searchPrompt === "" ? true : false} >{ isLoading ? "Searching..." : "Search"}</button>
    </form>
  )
}

export default Searchbar