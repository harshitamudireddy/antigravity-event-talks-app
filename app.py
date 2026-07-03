import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_html_content(html_content):
    """
    Parses the HTML content of a release note entry.
    Splits the content into sections based on <h3> tags (e.g., Feature, Change, Issue, Announcement).
    """
    if not html_content:
        return []
    
    sections = []
    # Split content by <h3>Type</h3>
    parts = re.split(r'<h3>(.*?)</h3>', html_content)
    
    if len(parts) > 1:
        for i in range(1, len(parts), 2):
            note_type = parts[i].strip()
            content_html = parts[i+1].strip() if i+1 < len(parts) else ""
            
            # Extract plain text for social sharing / tweeting
            # Remove HTML tags and clean up spacing
            plain_text = re.sub(r'<[^>]+>', '', content_html)
            plain_text = re.sub(r'\s+', ' ', plain_text).strip()
            
            sections.append({
                "type": note_type,
                "content_html": content_html,
                "plain_text": plain_text
            })
    else:
        # Fallback if no <h3> tags found
        plain_text = re.sub(r'<[^>]+>', '', html_content)
        plain_text = re.sub(r'\s+', ' ', plain_text).strip()
        sections.append({
            "type": "Update",
            "content_html": html_content,
            "plain_text": plain_text
        })
        
    return sections

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    try:
        # Fetch the feed
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        # Parse XML
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            title_text = title.text.strip() if title is not None else "Unknown Date"
            
            id_el = entry.find('atom:id', ns)
            id_text = id_el.text.strip() if id_el is not None else ""
            
            updated_el = entry.find('atom:updated', ns)
            updated_text = updated_el.text.strip() if updated_el is not None else ""
            
            # Find alternate link
            link_href = ""
            for link_el in entry.findall('atom:link', ns):
                if link_el.attrib.get('rel') == 'alternate' or not link_href:
                    link_href = link_el.attrib.get('href', '')
            
            content_el = entry.find('atom:content', ns)
            content_html = content_el.text if content_el is not None else ""
            
            sections = parse_html_content(content_html)
            
            entries.append({
                "title": title_text,
                "id": id_text,
                "updated": updated_text,
                "link": link_href,
                "sections": sections
            })
            
        return jsonify({
            "status": "success",
            "count": len(entries),
            "entries": entries
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Run the Flask app on localhost, port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
