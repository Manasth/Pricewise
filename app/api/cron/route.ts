import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        connectToDB();

        const products = await Product.find({});

        if(!products) throw new Error("No Product Found");

        const updatedProducts: any = await Promise.all(
            products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
                if(!scrapedProduct) throw new Error("No Product Found");
                const updatedPriceHistory: any = [
                    ...scrapedProduct.priceHistory,
                    { price: scrapedProduct.currentPrice }
                ]

                currentProduct = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                }

                const updatedProduct = await Product.findOneAndUpdate(
                    { url: scrapedProduct.url },
                    currentProduct
                )

                const emailNotifType = await getEmailNotifType(scrapedProduct, currentProduct);

                if(emailNotifType && updatedProduct.users.length > 0){
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url
                    };
                    
                    const emailContent = await generateEmailBody(productInfo, emailNotifType);

                    const userEmails = updatedProduct.users.map((user: any) => {
                        return user.email;
                    })
    
                    await sendEmail(emailContent, userEmails)
                }

                return updatedProducts;
            })
        )
        return NextResponse.json({
            message: "OK",
            data: updatedProducts
        })
    } catch (error) {
        throw new Error(`Error in GET: ${error}`);
    }
}