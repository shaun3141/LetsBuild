import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.*;
import java.net.URL;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Scanner;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Main {

    public volatile static Scanner scanner = null;
    public volatile static FileWriter fw = null;
    public volatile static FileWriter fw_websites = null;
    public volatile static Object readLock = new Object();
    public volatile static Object writeLock = new Object();

    public static void main(String[] args) throws IOException, InterruptedException {
        CreateSQLQueries();
        LookupPlaceDetails();
    }

    private static void CreateSQLQueries() {
        try {
            Scanner scanner = new Scanner(new File("cities.csv"));
            FileWriter fw = new FileWriter("SQL Queries.txt");

            while (scanner.hasNextLine()) {
                String csvLine = scanner.nextLine();
                String[] csvRow = csvLine.split(",");

                String sqlLine = "INSERT INTO \"ZIPCODE\" (\"ZIPCODE\",\"State\",\"City\",\"Lat\",\"Lng\") VALUES (";
                sqlLine += csvRow[0] + ",'" + csvRow[1] + "','" + csvRow[2] + "'," + csvRow[3] + "," + csvRow[4] + ");";

                fw.write(sqlLine + "\n");
            }

            fw.close();
            scanner.close();
        } catch (Exception e) {

        }

    }

    private static void LookupPlaceDetails() throws IOException, InterruptedException {
        final int NUM_THREADS = 10;

        ExecutorService es = Executors.newFixedThreadPool(NUM_THREADS);

        scanner = new Scanner(new File("Unique PlaceId List.txt"));
        fw = new FileWriter("Studio Details");
        fw_websites = new FileWriter("Website List");

        for (int i = 0; i < NUM_THREADS; i++) {
            es.execute(new ApiRequestThread());
        }

        es.awaitTermination(10, TimeUnit.HOURS);

        es.shutdown();
        scanner.close();
        fw.close();
        fw_websites.close();
    }

    private static void DoRadarSearch() throws IOException {
        Scanner scanner = new Scanner(new File("cities.csv"));
        FileWriter fw = new FileWriter("PlaceId List.txt");

        while (scanner.hasNextLine()) {
            String csvLine = scanner.nextLine();
            String[] csvRow = csvLine.split(",");

            try {
                URL googleAPIRequest = new URL("https://maps.googleapis.com/maps/api/place/radarsearch/json?location=" + csvRow[3] + "," + csvRow[4] + "&radius=10000&keyword=dance+studio&key=AIzaSyC2-t5fBfRicBCIPn_sdNG704a1FEfMH4A");
                BufferedReader in = new BufferedReader(new InputStreamReader(googleAPIRequest.openStream()));

                String line;
                String jsonResults = "";
                while ((line = in.readLine()) != null) {
                    jsonResults += line;
                }
                in.close();

                String placeIdStartToken = "\"place_id\" : \"";
                String placeIdEndToken = "\",";

                Pattern placeIdPattern = Pattern.compile(Pattern.quote(placeIdStartToken) + "(.*?)" + Pattern.quote(placeIdEndToken));
                Matcher placeIdMatcher = placeIdPattern.matcher(jsonResults);

                int numPlacesFound = 0;
                while (placeIdMatcher.find()) {
                    String placeId = placeIdMatcher.group(1);
                    numPlacesFound++;
                    fw.write(csvRow[1] + "," + csvRow[2] + "," + placeId + "\n");
                }

                System.out.println("Num places found for " + csvRow[2] + ", " + csvRow[1] + ": " + numPlacesFound);
            } catch (Exception e) {
                System.out.println("EXCEPTION OCCURRED <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            }

        }

        fw.close();
    }

    private static void RemoveDuplicates() throws IOException {
        Scanner scanner = new Scanner(new File("PlaceIDListComplete"));
        FileWriter fw = new FileWriter("Unique PlaceId List.txt");

        HashSet<String> uniqueVals = new HashSet<>();

        HashMap<String,String> map = new HashMap<>();

        while (scanner.hasNextLine()) {
            String csvLine = scanner.nextLine();
            String[] csvRow = csvLine.split(",");
            map.put(csvRow[2],csvLine);
        }

        System.out.println("Unique Vals: " + map.size());

        for (String str : map.values()) {
            fw.write(str + "\n");
        }

        fw.close();
        scanner.close();
    }
}

class ApiRequestThread implements Runnable {

    volatile boolean hasNext = true;

    ApiRequestThread() {
        new Thread(this);
    }

    public void run() {

        Gson gson = new GsonBuilder().create();

        while (hasNext) {
            String csvLine = null;

            synchronized (Main.readLock) {
                if (Main.scanner.hasNextLine()) {
                    csvLine = Main.scanner.nextLine();
                }
            }

            if (csvLine == null) {
                hasNext = false;
            } else {
                // Make API request
                String[] csvRow = csvLine.split(",");
                String APIResponse = null;
                String Website = null;

                try {
                    URL googleAPIRequest = new URL("https://maps.googleapis.com/maps/api/place/details/json?placeid=" + csvRow[2] + "&key=AIzaSyC2-t5fBfRicBCIPn_sdNG704a1FEfMH4A");
                    BufferedReader in = new BufferedReader(new InputStreamReader(googleAPIRequest.openStream()));

                    String line;
                    String jsonResults = "";
                    while ((line = in.readLine()) != null) {
                        jsonResults += line;
                    }
                    in.close();

                    Result result = gson.fromJson(jsonResults,Example.class).getResult();
                    APIResponse = result.getName() + " ||| " + result.getWebsite() + " ||| " + result.getFormattedAddress() + " ||| " + result.getInternationalPhoneNumber();
                    APIResponse += " ||| " + result.getUrl() + " ||| " + result.getGeometry().getLocation().getLat() + " ||| " + result.getGeometry().getLocation().getLng() + " ||| " + result.getRating();

                    Website = result.getWebsite();

                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (APIResponse != null) {
                    synchronized (Main.writeLock) {
                        System.out.println(APIResponse);
                        try {
                            Main.fw.write(String.format("%s\n", APIResponse));
                            if (Website != null && !Website.equals("null")) {
                                Main.fw_websites.write(Website + ",\n");
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        }
    }
}




// ==================================================================================================================


// ===========================================================================================================================================================

////        String[] states = {"Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Montana","Nebraska","Nevada","New-Hampshire","New-Jersey","New-Mexico","New-York","North-Carolina","North-Dakota","Ohio","Oklahoma","Oregon","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Pennsylvania","Rhode-Island","South-Carolina","South-Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West-Virginia","Wisconsin","Wyoming"};
//
//        String[] states = {"Iowa"};
//
//        FileWriter fw = new FileWriter("CityListing.csv");
////        fw.write("Hey");
////        fw.close();
//
////        FileWriter cityLinksFW = new FileWriter("CityLinks.txt");
//
//        for (String state : states) {
//            URL statePage = new URL("http://www.city-data.com/city/" + state + ".html");
//            BufferedReader stateIn = new BufferedReader(new InputStreamReader(statePage.openStream()));
//
//            String line;
//            String stateSourceCode = "";
//            while ((line = stateIn.readLine()) != null) {
//                stateSourceCode += line;
//            }
//            stateIn.close();
//
//            String cityStartToken = ";'><p></p></td><td><";
//            String cityEndToken = "'>";
//
//            Pattern statePattern = Pattern.compile(Pattern.quote(cityStartToken) + "(.*?)" + Pattern.quote(cityEndToken));
//            Matcher stateMatcher = statePattern.matcher(stateSourceCode);
//
//            int numRecords = 0;
//
//            while (stateMatcher.find()) {
//
//                // Get City Link and City Name
//                String cityLink = "http://www.city-data.com/city/";
//                String cityScrapedHTML = stateMatcher.group(1);
//
//                String cityName;
//
//                if (cityScrapedHTML.contains("javascript")) {
//                    int startIndex = cityScrapedHTML.indexOf("\"");
//                    int endIndex = cityScrapedHTML.lastIndexOf("\"");
//                    cityName = cityScrapedHTML.substring(startIndex + 1, endIndex);
//                    cityLink += cityName + "-" + state + ".html";
//                } else {
//                    String[] hrefParts = cityScrapedHTML.split("'");
//                    cityName = hrefParts[1].substring(0, hrefParts[1].length() - state.length() - 6); // subtracting "-STATENAME.html"
//                    cityLink += hrefParts[1];
//                }
//
//                // Scrape Lat, Lng from City
//                URL cityPage = new URL(cityLink);
//                BufferedReader cityIn = new BufferedReader(new InputStreamReader(cityPage.openStream()));
//
//                String cityLine;
//                String citySourceCode = "";
//                while ((cityLine = cityIn.readLine()) != null) {
//                    citySourceCode += cityLine;
//                }
//                cityIn.close();
//
//                // example String <section id="coordinates" class="coordinates"><p><b>Latitude:</b> 42.03 N<b>, Longitude:</b> 93.63 W</p></section>
//                String latLngStartToken = "<b>Latitude:</b> ";
//                String latLngEndToken = " W</p></section>";
//
//                Pattern cityPattern = Pattern.compile(Pattern.quote(latLngStartToken) + "(.*?)" + Pattern.quote(latLngEndToken));
//                Matcher cityMatcher = cityPattern.matcher(citySourceCode);
//
//                while (cityMatcher.find()) {
//
//                    // Get Lat/Lng
//                    String latLngHTML = cityMatcher.group(1);
//
//                    // Write State, City, Lat, Lng to file
//                    String lat = latLngHTML.substring(0,latLngHTML.indexOf(" "));
//                    String lng = latLngHTML.substring(latLngHTML.lastIndexOf(" ") + 1,latLngHTML.length());
//                    System.out.println(state + "," + cityName + "," + lat + "," + lng);
//                    fw.write(state + "," + cityName + "," + lat + "," + lng + "\n");
//                }
//
//                // Increment Number of Records in State
//                numRecords++;
////                cityLinksFW.write(cityLink + "\n");
//            }
//
////            cityLinksFW.write("\n\n\n\n");
//            System.out.println("Done with " + state + ": Found " + numRecords + " entries\n\n\n\n\n");
//        }
//
//        System.out.print("DONE!");
//        fw.close();