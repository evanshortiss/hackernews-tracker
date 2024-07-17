import log from 'barelog'
import timestring from 'timestring'

let previousTopStoryId = null
const refreshInterval = timestring(process.env.REFRESH_INTERVAL ? process.env.REFRESH_INTERVAL : '5m', 'ms')

log(`Starting HackerNews top story tracker. A refresh will be performed every ${refreshInterval}ms`)

async function doFetch (url) {
  const { signal } = new AbortController()
  const timeout = setTimeout(() => signal.abort(), 10000)

  try {
    const res = await fetch(url, {
      signal
    })
  
    if (res.ok) {
      return res.json()
    } else {
      const text = await res.text()
  
      throw new Error(`Fetching URL ${url}. Response status code: ${res.status}. Response body: "${text}"`)
    }
  } catch (e) {
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

function getTopStoryId () {
  return doFetch('https://hacker-news.firebaseio.com/v0/topstories.json').then((json) => json[0])
}

function getStoryDetails (id) {
  return doFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`)
}

async function refreshTopStory () {
  try {
    const topStoryId = await getTopStoryId()

    if (topStoryId === previousTopStoryId) {
      log('Top story is unchanged since last refresh')
    } else {
      const topStoryDetails = await getStoryDetails(topStoryId)
      
      // Record this top story ID to avoid reprinting it if it remains top
      previousTopStoryId = topStoryDetails.id

      log(`The latest top story is:\n${JSON.stringify(topStoryDetails, null, 2)}`)
    }
  } catch (e) {
    log('Error refreshing top story:')
    log(e)
  } finally {
    log(`Next refresh queued for ${new Date(Date.now() + refreshInterval).toISOString()}`)
    setTimeout(refreshTopStory, refreshInterval)
  }
}

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, (s) => {
    log(`Process received ${s} signal. Exiting...`)
    process.exit(0)
  })
})

refreshTopStory()