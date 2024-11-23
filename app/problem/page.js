/*
 * Paginated API
 *
 * Problem Description
 *
 * A third-party API that we're using has a paginated API.  It returns results in
 * chunks of N.  This is implemented below on "fetchPage"
 *
 * We don't think that API is very useful, and would prefer an implementation where only
 * one call to "fetch" will return a given number of results, abstracting away the need
 * to do pagination.
 *
 * Your task will be to implement ResultFetcher.fetch(). This function takes in a
 * number of items, "numResults", and returns that many items back from the "fetchPage"
 * API. Also each subsequent call to "fetch" should return the next "numResults" amount
 * of items from fetchPage in order, for example:
 *
 * fetcher.fetch(5) // [0, 1, 2, 3, 4]
 * fetcher.fetch(2) // [5, 6]
 * fetcher.fetch(7) // [7, 8, 9, 10, 11, 12, 13]
 */

// These numbers are for testing only and may be changed by the interviewer.
// Do not use them in your solution
const MAX_RESULTS = 103;
const PAGE_SIZE = 10;

/**
 * External API -- Should not be modified for solution
 *
 * Returns the results at the provided page index along with the index of the next page.
 * If page === undefined, starts from the beginning.  Otherwise, fetches the next N records
 * at the requested page. If the maximum amount of results has been reached, returns an empty
 * array for results and null for nextPage.
 *
 * @typedef {Object} FetchResponse
 * @property {Array<number>} results The array of results.
 * @property {number|null} nextPage The next page in the sequence.
 *
 * @param {number} page
 * @return {FetchResponse}
 *  {
 *      "results": [...],
 *      "nextPage": 3,
 *  }
 */
function fetchPage(page = 0) {
    const results = [];

    if (page * PAGE_SIZE > MAX_RESULTS) {
        return {
            nextPage: null,
            results,
        };
    }

    for (let i = page * PAGE_SIZE; i < Math.min(MAX_RESULTS, (page + 1) * PAGE_SIZE); i += 1) {
        results.push(i);
    }

    return {
        nextPage: page + 1,
        results,
    };
}


// Array
// TO IMPLEMENT
class ResultFetcher {
    /**
     * @param {number} numResults The amount of results to return.
     */

    constructor(MAX_RESULTS) {
      this.MAX_RESULTS = MAX_RESULTS
      this.currentPage = 0
      this.fetchedResult = []
    }

    fetchData(neededItems) {
      while (this.MAX_RESULTS.length < neededItems) {
        const pageData = this.fetchPage(this.currentPage)
        this.fetchedResult.push(...pageData)
        this.currentPage++
      }

      return this.fetchedResult.slice(0, neededItems)
    }

    fetch(numResults) { // 2

      // number of items
      // if not enough items, fetch the next page, 



       const {results, nextPage} = fetchPage(0); //{result:[0.1.2.3.4,5,6,7,8,9], nextPage:1}

       while (results.length < numResults && nextPage !== null) {
        const {result: pageData, nextPage: next} = fetchPage(nextPage);
        results = results.concat(pageData);
        nextPage = next;
       }

      
       return results.slice(0, numResults);  // [5,6,7,8,9]

      

    }
}

// Testing
function testCase(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        console.log(`FAILED: expected [${expected}], got [${actual}]`);
    } else {
        console.log('SUCCESS');
    }
}

const results = [...Array(MAX_RESULTS).keys()];
let fetcher = new ResultFetcher();
testCase(fetcher.fetch(5), results.slice(0, 5)); // [0,1,2,3,4]
testCase(fetcher.fetch(2), results.slice(5, 7)); // [5,6]
// testCase(fetcher.fetch(7), results.slice(7, 14));
// testCase(fetcher.fetch(103), results.slice(14));
// testCase(fetcher.fetch(10), []);

// fetcher = new ResultFetcher();
// testCase(fetcher.fetch(200), results);