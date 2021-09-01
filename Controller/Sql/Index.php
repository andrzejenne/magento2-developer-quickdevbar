<?php
namespace ADM\QuickDevBar\Controller\Sql;

class Index extends \ADM\QuickDevBar\Controller\Index
{
    public function execute()
    {
        $jsons = glob('/tmp/*.head.json');
        $files = [];
        foreach ($jsons as $json) {
            $head = \json_decode(file_get_contents($json), true);
            $head['file'] = basename($json);
            $files[basename($json, '.head.json')] = $head;
        }

        ksort($files, SORT_NUMERIC);

        $resultRaw = $this->_resultRawFactory->create();

        return $resultRaw->setContents(
            \json_encode($files)
        )->setHeader('Content-Type', 'application/json');
    }
}
