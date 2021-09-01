<?php
namespace ADM\QuickDevBar\Controller\Sql;

class View extends \ADM\QuickDevBar\Controller\Index
{
    public function execute()
    {
        $fileKey = $this->getRequest()->getParam('json', '');

        $headPath = '/tmp/' . basename($fileKey);
        $dataPath = '/tmp/' . basename($fileKey, '.head.json') . '.data.json';

        if (!file_exists($headPath) || !file_exists($dataPath)) {
            return $this->_resultRawFactory->create()
                ->setStatusHeader(404)
                ->setContents('{"error": "not found"}');
        }

        $resultRaw = $this->_resultRawFactory->create();

        return $resultRaw->setContents(
            \file_get_contents($dataPath)
        )->setHeader('Content-Type', 'application/json');
    }
}
