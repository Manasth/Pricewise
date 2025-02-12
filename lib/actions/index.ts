"use server"

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import Product from "../models/product.model";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";
import mongoose from "mongoose";
import { version } from "node:punycode";

export async function scrapeAndStoreProduct(productUrl: string) {
    console.log(productUrl);
    if(!productUrl) return;

    try {
        connectToDB();

        const scrapedProduct = await scrapeAmazonProduct(productUrl);
        console.log(scrapedProduct);

        if(!scrapedProduct) return;

        let product = scrapedProduct;

        const existingProduct = await Product.findOne({url: scrapedProduct.url});

        if(existingProduct) {
            const updatedPriceHistory: any = [
              ...existingProduct.priceHistory,
              { price: scrapedProduct.currentPrice }
            ]
      
            product = {
              ...scrapedProduct,
              priceHistory: updatedPriceHistory,
              lowestPrice: getLowestPrice(updatedPriceHistory),
              highestPrice: getHighestPrice(updatedPriceHistory),
              averagePrice: getAveragePrice(updatedPriceHistory),
            }
          }

        const newProduct = await Product.findOneAndUpdate(
            {url: scrapedProduct.url},
            product,
            {upsert: true, new: true}
        );

        revalidatePath(`/products/${newProduct.id}`);

        return product;
        // const existingProduct = await Product.findOne()
    } catch (error: any) {
        throw new Error(`Failed to create/update product: ${error.message}`);
    }
}

export async function getProductById(productId: string) {
    try {
        connectToDB();

        const product = await Product.findOne({_id: productId});

        if(!product) return null;

        return product;
    } catch (error) {
        console.log(error)
    }
}

export async function getAllProducts() {
    try {
        connectToDB();

        const products = await Product.find({});

        if(!products) return null;

        return products;
        
    } catch (error) {
        console.log(error);
    }
}

export async function getSimilarProduct(productId: string) {
    try {
        connectToDB();

        const currentProduct = await Product.findById(productId);

        if(!currentProduct) return null;

        const similarProducts = await Product.find({
            _id: {$ne: productId}
        }).limit(3);

        return similarProducts;
        
    } catch (error) {
        console.log(error);
    }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
    try {
        // if (!mongoose.Types.ObjectId.isValid(productId)) {
        //     console.error("Invalid ObjectId:", productId);
        //     return;
        //   }

      const product = await Product.findById(new mongoose.Types.ObjectId(parseInt(productId)));
  
      if(!product) return;
  
      const userExists = product.users.some((user: User) => user.email === userEmail);
  
      if(!userExists) {
        product.users.push({ email: userEmail });
  
        await product.save();
  
        const emailContent = await generateEmailBody(product, "WELCOME");
  
        await sendEmail(emailContent, [userEmail]);
      }
    } catch (error) {
      console.log(error);
    }
  }